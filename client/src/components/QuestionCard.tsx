import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Heart, HelpCircle, Divide, Clock } from "lucide-react";
import { Question } from "@shared/schema";

interface QuestionCardProps {
  question: Question;
  currentQuestion: number;
  totalQuestions: number;
  lives: number;
  maxLives: number;
  score: number;
  timeLeft?: number;
  maxTime?: number;
  selectedAnswer?: string;
  showResult?: boolean;
  correctAnswer?: string;
  onAnswerSelect: (answer: string) => void;
  onUseItem?: (item: string) => void;
  userInventory?: Record<string, number>;
}

export default function QuestionCard({
  question,
  currentQuestion,
  totalQuestions,
  lives,
  maxLives,
  score,
  timeLeft,
  maxTime,
  selectedAnswer,
  showResult,
  correctAnswer,
  onAnswerSelect,
  onUseItem,
  userInventory = {},
}: QuestionCardProps) {
  const options = [
    { key: "A", text: question.optionA },
    { key: "B", text: question.optionB },
    { key: "C", text: question.optionC },
    { key: "D", text: question.optionD },
  ];

  const getAnswerButtonClass = (optionKey: string) => {
    const baseClass = "bg-game-darker hover:bg-gray-700 border-2 border-gray-600 text-left p-4 rounded-xl transition-all transform hover:scale-[1.02] w-full";
    
    if (!showResult) {
      return `${baseClass} ${selectedAnswer === optionKey ? 'border-game-purple bg-game-purple/20' : 'hover:border-game-purple'}`;
    }
    
    if (optionKey === correctAnswer) {
      return `${baseClass} border-game-green bg-game-green/20`;
    }
    
    if (selectedAnswer === optionKey && optionKey !== correctAnswer) {
      return `${baseClass} border-red-500 bg-red-500/20`;
    }
    
    return `${baseClass} opacity-50`;
  };

  const timePercentage = timeLeft && maxTime ? (timeLeft / maxTime) * 100 : 0;

  return (
    <Card className="game-card p-8 shadow-2xl max-w-4xl mx-auto">
      <CardContent className="p-0">
        {/* Game Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <div className="text-lg font-semibold flex items-center">
              <HelpCircle className="text-game-purple mr-2" />
              Вопрос {currentQuestion}/{totalQuestions}
            </div>
            <div className="flex items-center space-x-1">
              {Array.from({ length: maxLives }, (_, i) => (
                <Heart
                  key={i}
                  className={`w-5 h-5 ${
                    i < lives ? "text-red-500 fill-red-500" : "text-gray-600"
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-game-green">{score.toLocaleString()}</div>
            <div className="text-sm text-gray-400">очков</div>
          </div>
        </div>

        {/* Timer */}
        {timeLeft !== undefined && maxTime && (
          <div className="mb-6">
            <div className="flex items-center justify-center mb-2">
              <div className="text-3xl font-bold text-game-orange">
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
              </div>
            </div>
            <Progress 
              value={timePercentage} 
              className="w-full h-2 bg-gray-700"
            />
          </div>
        )}

        {/* Question */}
        <div className="text-center mb-8">
          <h3 className="text-2xl font-semibold mb-4">{question.question}</h3>
        </div>

        {/* Answer Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {options.map((option) => (
            <Button
              key={option.key}
              onClick={() => onAnswerSelect(option.key)}
              className={getAnswerButtonClass(option.key)}
              disabled={showResult}
              variant="ghost"
            >
              <div className="flex items-center w-full">
                <div className="w-8 h-8 bg-game-purple/20 border border-game-purple rounded-full flex items-center justify-center mr-3 font-semibold">
                  {option.key}
                </div>
                <span className="text-left">{option.text}</span>
              </div>
            </Button>
          ))}
        </div>

        {/* Power-ups */}
        {onUseItem && (
          <div className="flex justify-center space-x-4">
            <Button
              onClick={() => onUseItem("50_50")}
              disabled={!userInventory["50_50"] || userInventory["50_50"] <= 0}
              className="bg-game-green/20 hover:bg-game-green/30 border border-game-green text-game-green px-4 py-2 rounded-lg font-semibold transition-colors"
              variant="ghost"
            >
              <Divide className="w-4 h-4 mr-1" />
              50/50 ({userInventory["50_50"] || 0})
            </Button>
            <Button
              onClick={() => onUseItem("extra_life")}
              disabled={!userInventory["extra_life"] || userInventory["extra_life"] <= 0}
              className="bg-game-orange/20 hover:bg-game-orange/30 border border-game-orange text-game-orange px-4 py-2 rounded-lg font-semibold transition-colors"
              variant="ghost"
            >
              <Heart className="w-4 h-4 mr-1" />
              Жизнь ({userInventory["extra_life"] || 0})
            </Button>
            <Button
              onClick={() => onUseItem("extra_time")}
              disabled={!userInventory["extra_time"] || userInventory["extra_time"] <= 0}
              className="bg-game-blue/20 hover:bg-game-blue/30 border border-game-blue text-game-blue px-4 py-2 rounded-lg font-semibold transition-colors"
              variant="ghost"
            >
              <Clock className="w-4 h-4 mr-1" />
              Время ({userInventory["extra_time"] || 0})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
