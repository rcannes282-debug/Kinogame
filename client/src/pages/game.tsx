import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import QuestionCard from "@/components/QuestionCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Question } from "@shared/schema";

type GameQuestion = Omit<Question, 'correctAnswer'>;
import { Trophy, RotateCcw, Home } from "lucide-react";

export default function Game() {
  const params = useParams<{ mode?: string }>();
  const [location, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const gameMode = params.mode || "timed";
  const isGuestMode = gameMode === "guest";

  // Game state
  const [gameSession, setGameSession] = useState<any>(null);
  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5);
  const [timeLeft, setTimeLeft] = useState<number | undefined>();
  const [gameCompleted, setGameCompleted] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);

  // Game configuration
  const maxTime = gameMode === "timed" ? 30 : undefined;
  const maxLives = gameMode === "infinite" ? 5 : 1;
  const questionsPerGame = gameMode === "infinite" ? 50 : 10;

  // Fetch questions - без правильных ответов
  const { data: questionData, isLoading: questionsLoading } = useQuery<GameQuestion[]>({
    queryKey: ["/api/questions"],
    queryFn: async () => {
      const category = gameMode === "top250" ? "top_250" : "general";
      const response = await fetch(`/api/questions?category=${category}&limit=${questionsPerGame}`);
      return response.json();
    },
  });

  // Fetch user inventory for authenticated users
  const { data: inventory } = useQuery<any[]>({
    queryKey: ["/api/users", user?.id, "inventory"],
    enabled: !!user?.id && isAuthenticated,
  });

  // Initialize game
  const createGameSession = useMutation({
    mutationFn: async (sessionData: any) => {
      return apiRequest("POST", "/api/game-sessions", sessionData);
    },
    onSuccess: (data) => {
      const session = data.json();
      setGameSession(session);
    },
  });

  // Update game session
  const updateGameSession = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      return apiRequest("PUT", `/api/game-sessions/${id}`, updates);
    },
    onSuccess: () => {
      // Инвалидируем кеш после завершения игры
      queryClient.invalidateQueries({ queryKey: ['/api/leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id, 'game-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ['/api/users', user.id] });
      }
    },
  });

  // Use inventory item
  const useItem = useMutation({
    mutationFn: async ({ itemType, quantity }: { itemType: string; quantity: number }) => {
      if (!user?.id) throw new Error("User not authenticated");
      return apiRequest("POST", `/api/users/${user.id}/use-item`, { itemType, quantity });
    },
    onSuccess: () => {
      // Обновляем инвентарь после использования предмета
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ['/api/users', user.id, 'inventory'] });
      }
    },
  });

  // Initialize game on component mount
  useEffect(() => {
    if (questionData && !gameSession) {
      setQuestions(questionData);
      if (maxTime) setTimeLeft(maxTime);
      setLives(maxLives);

      // Create game session if not guest mode
      if (!isGuestMode) {
        createGameSession.mutate({
          gameMode,
          category: gameMode === "top250" ? "top_250" : "general",
          livesRemaining: maxLives,
        });
      }
    }
  }, [questionData, gameSession, gameMode, maxLives, maxTime, isGuestMode]);

  // Timer logic
  useEffect(() => {
    if (timeLeft === undefined || showResult || gameCompleted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === undefined || prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, showResult, gameCompleted]);

  // Handle time up
  const handleTimeUp = useCallback(() => {
    if (!showResult) {
      handleAnswerSubmit(null);
    }
  }, [showResult]);

  // Handle answer selection
  const handleAnswerSelect = (answer: string) => {
    if (showResult || gameCompleted) return;
    setSelectedAnswer(answer);
    handleAnswerSubmit(answer);
  };

  // Проверка ответа на бэкенде
  const checkAnswer = useMutation({
    mutationFn: async ({ questionId, answer }: { questionId: string; answer: string | null }) => {
      if (!answer) return { isCorrect: false };
      const response = await fetch(`/api/questions/${questionId}/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer }),
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      const { isCorrect } = data;
      setShowResult(true);
      
      if (isCorrect) {
        const points = gameMode === "timed" ? Math.max(100, timeLeft ? timeLeft * 10 : 100) : 100;
        setScore(prev => prev + points);
        setCorrectAnswers(prev => prev + 1);
      } else if (gameMode === "infinite") {
        setLives(prev => prev - 1);
      }

      // Move to next question after 2 seconds
      setTimeout(() => {
        if (isCorrect || gameMode !== "infinite" || lives > 1) {
          nextQuestion();
        } else {
          endGame();
        }
      }, 2000);
    },
  });

  // Handle answer submission
  const handleAnswerSubmit = (answer: string | null) => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion?.id) return;
    
    checkAnswer.mutate({ questionId: currentQuestion.id, answer });
  };

  // Move to next question
  const nextQuestion = () => {
    if (currentQuestionIndex + 1 >= questions.length) {
      endGame();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      if (maxTime) setTimeLeft(maxTime);
    }
  };

  // End game
  const endGame = () => {
    setGameCompleted(true);
    
    // Update game session if not guest mode
    if (gameSession) {
      updateGameSession.mutate({
        id: gameSession.id,
        updates: {
          score,
          questionsAnswered: currentQuestionIndex + 1,
          correctAnswers,
          livesRemaining: lives,
          isCompleted: true,
          completedAt: new Date(),
        },
      });
    }
  };

  // Handle power-up usage
  const handleUseItem = async (itemType: string) => {
    if (!isAuthenticated || !user) {
      toast({
        title: "Требуется авторизация",
        description: "Войдите в систему, чтобы использовать предметы",
        variant: "destructive",
      });
      return;
    }

    try {
      await useItem.mutateAsync({ itemType, quantity: 1 });
      
      if (itemType === "extra_life") {
        setLives(prev => prev + 1);
        toast({ title: "Жизнь восстановлена!" });
      } else if (itemType === "extra_time" && maxTime) {
        setTimeLeft(prev => (prev || 0) + 30);
        toast({ title: "Добавлено 30 секунд!" });
      } else if (itemType === "50_50") {
        // Hide two incorrect answers
        toast({ title: "50/50 использована!" });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось использовать предмет",
        variant: "destructive",
      });
    }
  };

  // Restart game
  const restartGame = () => {
    setGameSession(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setLives(maxLives);
    setTimeLeft(maxTime);
    setGameCompleted(false);
    setCorrectAnswers(0);
    window.location.reload();
  };

  if (questionsLoading) {
    return (
      <div className="min-h-screen bg-game-darker text-white">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-game-purple border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400">Загружаем вопросы...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="min-h-screen bg-game-darker text-white">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="game-card p-8 text-center">
            <CardContent>
              <h2 className="text-2xl font-bold mb-4">Вопросы не найдены</h2>
              <p className="text-gray-400 mb-6">К сожалению, не удалось загрузить вопросы для этого режима.</p>
              <Button onClick={() => navigate("/")} className="game-button-purple">
                <Home className="mr-2" />
                На главную
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (gameCompleted) {
    return (
      <div className="min-h-screen bg-game-darker text-white">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <Card className="game-card p-8 text-center max-w-md w-full">
            <CardContent>
              <Trophy className="w-16 h-16 text-game-orange mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-2">Игра завершена!</h2>
              <div className="text-6xl font-bold text-game-green mb-2">{score.toLocaleString()}</div>
              <div className="text-gray-400 mb-6">очков набрано</div>
              
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div className="bg-game-darker p-3 rounded-lg">
                  <div className="text-gray-400">Правильных ответов</div>
                  <div className="font-semibold">{correctAnswers}/{currentQuestionIndex + 1}</div>
                </div>
                <div className="bg-game-darker p-3 rounded-lg">
                  <div className="text-gray-400">Точность</div>
                  <div className="font-semibold">
                    {Math.round((correctAnswers / (currentQuestionIndex + 1)) * 100)}%
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Button onClick={restartGame} className="w-full game-button-purple">
                  <RotateCcw className="mr-2" />
                  Играть снова
                </Button>
                <Button onClick={() => navigate("/")} variant="outline" className="w-full">
                  <Home className="mr-2" />
                  На главную
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const userInventoryMap = inventory?.reduce((acc: any, item: any) => {
    acc[item.itemType] = item.quantity;
    return acc;
  }, {}) || {};

  return (
    <div className="min-h-screen bg-game-darker text-white">
      <Header />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <QuestionCard
          question={currentQuestion}
          currentQuestion={currentQuestionIndex + 1}
          totalQuestions={questions.length}
          lives={lives}
          maxLives={maxLives}
          score={score}
          timeLeft={timeLeft}
          maxTime={maxTime}
          selectedAnswer={selectedAnswer || undefined}
          showResult={showResult}
          isCorrect={checkAnswer.data?.isCorrect}
          onAnswerSelect={handleAnswerSelect}
          onUseItem={isAuthenticated ? handleUseItem : undefined}
          userInventory={userInventoryMap}
        />
      </main>
    </div>
  );
}
