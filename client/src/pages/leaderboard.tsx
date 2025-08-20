import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Trophy, 
  Medal, 
  Crown, 
  TrendingUp, 
  Calendar,
  Star,
  Target,
  Zap
} from "lucide-react";

export default function Leaderboard() {
  const { user, isAuthenticated } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("week");

  // Fetch leaderboard data
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ["/api/leaderboard"],
    queryFn: async () => {
      const response = await fetch("/api/leaderboard?limit=100");
      return response.json();
    },
  });

  const getPodiumIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2: return <Medal className="w-6 h-6 text-gray-400" />;
      case 3: return <Medal className="w-6 h-6 text-yellow-600" />;
      default: return null;
    }
  };

  const getPodiumBorderColor = (rank: number) => {
    switch (rank) {
      case 1: return "border-yellow-400";
      case 2: return "border-gray-400";
      case 3: return "border-yellow-600";
      default: return "border-gray-600";
    }
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank <= 3) return "bg-game-orange";
    if (rank <= 10) return "bg-game-purple";
    if (rank <= 50) return "bg-game-blue";
    return "bg-gray-600";
  };

  const topThree = leaderboard?.slice(0, 3) || [];
  const remaining = leaderboard?.slice(3) || [];
  const userRank = leaderboard?.find((player: any) => player.id === user?.id);

  return (
    <div className="min-h-screen bg-game-darker text-white">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center">
            <Trophy className="mr-3 text-game-orange" />
            Рейтинг игроков
          </h1>
          <p className="text-xl text-gray-400">Лучшие игроки всех времен</p>
        </div>

        {/* Period Selector */}
        <div className="flex justify-center mb-8">
          <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <TabsList className="bg-game-dark border border-gray-700">
              <TabsTrigger value="week" className="data-[state=active]:bg-game-purple">
                Неделя
              </TabsTrigger>
              <TabsTrigger value="month" className="data-[state=active]:bg-game-purple">
                Месяц
              </TabsTrigger>
              <TabsTrigger value="all" className="data-[state=active]:bg-game-purple">
                Все время
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Card className="game-card overflow-hidden mb-8">
          <CardHeader className="bg-gradient-to-r from-game-purple/20 to-game-blue/20">
            <CardTitle className="flex justify-between items-center">
              <span>Топ игроков</span>
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="w-4 h-4" />
                <span>Обновлено сегодня</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-game-purple border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-400">Загружаем рейтинг...</p>
              </div>
            ) : leaderboard && leaderboard.length > 0 ? (
              <>
                {/* Top 3 Players */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  {topThree.map((player: any, index: number) => (
                    <Card
                      key={player.id}
                      className={`bg-game-darker border-2 ${getPodiumBorderColor(index + 1)} relative overflow-hidden`}
                    >
                      <CardContent className="p-6 text-center">
                        <div className="absolute top-2 right-2">
                          {getPodiumIcon(index + 1)}
                        </div>
                        <div className="relative mb-4">
                          <Avatar className="w-20 h-20 mx-auto border-4 border-current">
                            <AvatarImage src={player.profileImageUrl || undefined} />
                            <AvatarFallback className="text-lg font-bold">
                              {player.firstName?.[0] || player.email?.[0] || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-8 ${getRankBadgeColor(index + 1)} rounded-full flex items-center justify-center font-bold text-sm text-white`}>
                            {index + 1}
                          </div>
                        </div>
                        <h4 className="font-bold text-lg mb-1">
                          {player.firstName || player.email?.split("@")[0] || "Игрок"}
                        </h4>
                        <div className={`text-2xl font-bold mb-1 ${
                          index === 0 ? "text-yellow-400" :
                          index === 1 ? "text-gray-400" : "text-yellow-600"
                        }`}>
                          {player.totalScore.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-400">очков</div>
                        <div className="mt-3 flex justify-center space-x-4 text-xs text-gray-500">
                          <span>{player.gamesPlayed} игр</span>
                          <span>
                            {player.gamesPlayed > 0 
                              ? Math.round(player.totalScore / player.gamesPlayed)
                              : 0} ср/игра
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Remaining Players */}
                <div className="space-y-2">
                  {remaining.map((player: any, index: number) => {
                    const rank = index + 4;
                    const isCurrentUser = player.id === user?.id;
                    
                    return (
                      <Card
                        key={player.id}
                        className={`bg-game-darker border-gray-600 hover:border-game-blue transition-colors ${
                          isCurrentUser ? "ring-2 ring-game-purple" : ""
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className={`w-8 h-8 ${getRankBadgeColor(rank)} rounded-full flex items-center justify-center font-bold text-sm text-white`}>
                                {rank}
                              </div>
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={player.profileImageUrl || undefined} />
                                <AvatarFallback>
                                  {player.firstName?.[0] || player.email?.[0] || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-semibold flex items-center">
                                  {player.firstName || player.email?.split("@")[0] || "Игрок"}
                                  {isCurrentUser && (
                                    <Badge variant="secondary" className="ml-2 text-xs bg-game-purple/20 text-game-purple">
                                      Вы
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-gray-400">
                                  {player.totalScore.toLocaleString()} очков
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-400 flex items-center">
                                <Target className="w-4 h-4 mr-1" />
                                {player.gamesPlayed} игр
                              </div>
                              <div className="text-xs text-green-500 flex items-center">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                {player.gamesPlayed > 0 
                                  ? Math.round(player.totalScore / player.gamesPlayed)
                                  : 0} ср/игра
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Current User Position (if not in top) */}
                {isAuthenticated && userRank && userRank.rank > 10 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Star className="mr-2 text-game-purple" />
                      Ваша позиция
                    </h3>
                    <Card className="bg-game-purple/20 border-game-purple">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-8 h-8 bg-game-purple rounded-full flex items-center justify-center font-bold text-sm text-white">
                              {userRank.rank}
                            </div>
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={user?.profileImageUrl || undefined} />
                              <AvatarFallback>
                                {user?.firstName?.[0] || user?.email?.[0] || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-semibold flex items-center">
                                {user?.firstName || user?.email?.split("@")[0] || "Игрок"}
                                <Badge variant="secondary" className="ml-2 text-xs bg-game-purple text-white">
                                  Вы
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-300">
                                {userRank.totalScore.toLocaleString()} очков
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-300">
                              {userRank.gamesPlayed} игр
                            </div>
                            <div className="text-xs text-green-400">
                              {userRank.gamesPlayed > 0 
                                ? Math.round(userRank.totalScore / userRank.gamesPlayed)
                                : 0} ср/игра
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Рейтинг пуст</h3>
                <p className="text-gray-400 mb-6">Станьте первым игроком в рейтинге!</p>
                <Button asChild className="game-button-purple">
                  <a href="/game/timed">Начать играть</a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="game-card">
            <CardContent className="p-6 text-center">
              <Zap className="w-8 h-8 text-game-orange mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Самый активный игрок</h3>
              <p className="text-sm text-gray-400">
                {leaderboard && leaderboard.length > 0 
                  ? leaderboard.reduce((max: any, player: any) => 
                      player.gamesPlayed > (max?.gamesPlayed || 0) ? player : max
                    )?.firstName || "Неизвестно"
                  : "Неизвестно"
                }
              </p>
            </CardContent>
          </Card>

          <Card className="game-card">
            <CardContent className="p-6 text-center">
              <Target className="w-8 h-8 text-game-green mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Лучший средний результат</h3>
              <p className="text-sm text-gray-400">
                {leaderboard && leaderboard.length > 0 
                  ? Math.max(...leaderboard
                      .filter((p: any) => p.gamesPlayed > 0)
                      .map((p: any) => Math.round(p.totalScore / p.gamesPlayed))
                    ).toLocaleString()
                  : "0"
                } очков/игра
              </p>
            </CardContent>
          </Card>

          <Card className="game-card">
            <CardContent className="p-6 text-center">
              <Star className="w-8 h-8 text-game-blue mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Всего игроков</h3>
              <p className="text-sm text-gray-400">
                {leaderboard?.length || 0} активных игроков
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
