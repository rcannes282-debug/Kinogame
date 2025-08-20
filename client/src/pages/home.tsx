import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GameModeCard from "@/components/GameModeCard";
import { useAuth } from "@/hooks/useAuth";
import { Clock, Trophy, Infinity, Users, TrendingUp, Star, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

export default function Home() {
  const { user } = useAuth();

  const { data: leaderboard } = useQuery({
    queryKey: ["/api/leaderboard"],
    queryFn: async () => {
      const response = await fetch("/api/leaderboard?limit=5");
      return response.json();
    },
  });

  const { data: userSessions } = useQuery<any[]>({
    queryKey: ["/api/users", user?.id, "game-sessions"],
    enabled: !!user?.id,
  });

  const gameModes = [
    {
      title: "На время",
      description: "Отвечай быстро на вопросы о фильмах",
      icon: Clock,
      features: ["Вопросы по годам", "По жанрам", "По актерам"],
      buttonText: "Играть",
      buttonColor: "purple" as const,
      onPlay: () => window.location.href = "/game/timed",
    },
    {
      title: "Топ 250",
      description: "Вопросы о лучших фильмах всех времен",
      icon: Trophy,
      features: ["Классические фильмы", "Современные хиты", "Мировое кино"],
      buttonText: "Играть",
      buttonColor: "orange" as const,
      onPlay: () => window.location.href = "/game/top250",
    },
    {
      title: "Бесконечность",
      description: "Играй пока не потратишь 5 жизней",
      icon: Infinity,
      features: ["5 жизней", "Набирай максимум очков", "Покупка жизней"],
      buttonText: "Играть",
      buttonColor: "green" as const,
      onPlay: () => window.location.href = "/game/infinite",
    },
  ];

  return (
    <div className="min-h-screen bg-game-darker text-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <section className="mb-12">
          <div className="bg-gradient-to-r from-game-purple/20 to-game-blue/20 rounded-2xl p-8 border border-gray-700">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Добро пожаловать, {user?.firstName || user?.email?.split("@")[0] || "игрок"}!
                </h1>
                <p className="text-gray-300">Готов проверить свои знания о кино?</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 mt-4 md:mt-0">
                <Button asChild className="game-button-purple">
                  <Link href="/game/timed">Быстрая игра</Link>
                </Button>
                <Button asChild className="game-button-blue">
                  <Link href="/multiplayer">Мультиплеер</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Game Modes */}
            <section>
              <h2 className="text-2xl font-bold mb-6">Выбери режим игры</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-6">
                {gameModes.map((mode) => (
                  <GameModeCard key={mode.title} {...mode} />
                ))}
              </div>
            </section>

            {/* Recent Games */}
            {userSessions && userSessions.length > 0 && (
              <section>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Последние игры</h2>
                  <Button variant="outline" asChild>
                    <Link href="/profile">Все игры</Link>
                  </Button>
                </div>
                <div className="space-y-3">
                  {userSessions.slice(0, 5).map((session: any) => (
                    <Card key={session.id} className="bg-game-dark border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold">
                              {session.gameMode === 'timed' ? 'На время' :
                               session.gameMode === 'top250' ? 'Топ 250' :
                               session.gameMode === 'infinite' ? 'Бесконечность' : 'Игра'}
                            </div>
                            <div className="text-sm text-gray-400 flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {new Date(session.createdAt).toLocaleDateString('ru')}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-game-green">
                              {session.score} очков
                            </div>
                            <div className="text-sm text-gray-400">
                              {session.correctAnswers}/{session.questionsAnswered}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* User Stats */}
            <Card className="bg-game-dark border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 text-game-green" />
                  Статистика
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Общий счет</span>
                  <span className="font-semibold text-game-green">
                    {user?.totalScore?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Игр сыграно</span>
                  <span className="font-semibold">{user?.gamesPlayed || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Монеты</span>
                  <span className="font-semibold text-game-orange">
                    {user?.coins?.toLocaleString() || 0}
                  </span>
                </div>
                <Button asChild className="w-full game-button-orange mt-4">
                  <Link href="/shop">Купить монеты</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Top Players */}
            <Card className="bg-game-dark border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Trophy className="mr-2 text-game-orange" />
                    Топ игроков
                  </span>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/leaderboard">Все</Link>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {leaderboard ? (
                  <div className="space-y-3">
                    {leaderboard.slice(0, 5).map((player: any, index: number) => (
                      <div key={player.id} className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                          index === 0 ? 'bg-game-orange text-black' :
                          index === 1 ? 'bg-gray-400 text-black' :
                          index === 2 ? 'bg-yellow-600 text-black' :
                          'bg-gray-600 text-white'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-sm">
                            {player.firstName || player.email?.split("@")[0] || "Игрок"}
                          </div>
                          <div className="text-xs text-gray-400">
                            {player.totalScore.toLocaleString()} очков
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400">Загрузка...</div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-gradient-to-br from-game-purple/10 to-game-blue/10 border-gray-700">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">Быстрые действия</h3>
                <div className="space-y-2">
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link href="/multiplayer">
                      <Users className="mr-2 w-4 h-4" />
                      Найти игру
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link href="/leaderboard">
                      <Star className="mr-2 w-4 h-4" />
                      Рейтинг
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link href="/shop">
                      <TrendingUp className="mr-2 w-4 h-4" />
                      Магазин
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
