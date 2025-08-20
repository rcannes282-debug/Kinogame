import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Search, 
  Users, 
  Clock, 
  Lock, 
  RefreshCw, 
  Zap,
  Settings,
  Crown,
  UserCheck,
  Eye
} from "lucide-react";

export default function Multiplayer() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [createRoomForm, setCreateRoomForm] = useState({
    name: "",
    maxPlayers: 8,
    timePerQuestion: 30,
    gameMode: "multiplayer",
    category: "general",
    isPrivate: false,
    password: "",
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Требуется авторизация",
        description: "Вы будете перенаправлены на страницу входа...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch available rooms
  const { data: rooms, isLoading: roomsLoading, refetch: refetchRooms } = useQuery({
    queryKey: ["/api/rooms"],
    enabled: isAuthenticated,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Create room mutation
  const createRoomMutation = useMutation({
    mutationFn: async (roomData: any) => {
      return apiRequest("POST", "/api/rooms", roomData);
    },
    onSuccess: async (response) => {
      const room = await response.json();
      toast({
        title: "Комната создана!",
        description: `Комната "${room.name}" успешно создана`,
      });
      setCreateRoomForm({
        name: "",
        maxPlayers: 8,
        timePerQuestion: 30,
        gameMode: "multiplayer",
        category: "general",
        isPrivate: false,
        password: "",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Ошибка авторизации",
          description: "Вы будете перенаправлены на страницу входа...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Ошибка",
        description: "Не удалось создать комнату",
        variant: "destructive",
      });
    },
  });

  // Join room mutation
  const joinRoomMutation = useMutation({
    mutationFn: async (roomId: string) => {
      return apiRequest("POST", `/api/rooms/${roomId}/join`, {});
    },
    onSuccess: () => {
      toast({
        title: "Вы присоединились к комнате!",
        description: "Ожидайте начала игры",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Ошибка авторизации",
          description: "Вы будете перенаправлены на страницу входа...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Ошибка",
        description: "Не удалось присоединиться к комнате",
        variant: "destructive",
      });
    },
  });

  const handleCreateRoom = () => {
    if (!createRoomForm.name.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите название комнаты",
        variant: "destructive",
      });
      return;
    }

    createRoomMutation.mutate(createRoomForm);
  };

  const handleJoinRoom = (roomId: string) => {
    joinRoomMutation.mutate(roomId);
  };

  const getGameModeText = (mode: string) => {
    switch (mode) {
      case "timed": return "На время";
      case "top250": return "Топ 250";
      case "infinite": return "Бесконечность";
      default: return "Мультиплеер";
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case "top_250": return "Топ 250 фильмов";
      case "by_year": return "По годам";
      case "by_genre": return "По жанрам";
      case "by_actor": return "По актерам";
      default: return "Общие вопросы";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-game-darker text-white">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-8 h-8 border-2 border-game-purple border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-game-darker text-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center">
            <Users className="mr-3 text-game-blue" />
            Мультиплеер лобби
          </h1>
          <p className="text-xl text-gray-400">Создавай комнаты и играй с друзьями</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Create Room */}
          <Card className="game-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="mr-3 text-game-green" />
                Создать комнату
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="roomName">Название комнаты</Label>
                <Input
                  id="roomName"
                  type="text"
                  placeholder="Моя крутая комната"
                  value={createRoomForm.name}
                  onChange={(e) => setCreateRoomForm(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-game-darker border-gray-600 text-white placeholder-gray-400 focus:border-game-purple"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxPlayers">Макс. игроков</Label>
                  <Select
                    value={createRoomForm.maxPlayers.toString()}
                    onValueChange={(value) => setCreateRoomForm(prev => ({ ...prev, maxPlayers: parseInt(value) }))}
                  >
                    <SelectTrigger className="bg-game-darker border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-game-darker border-gray-600">
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="6">6</SelectItem>
                      <SelectItem value="8">8</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="timePerQuestion">Время ответа</Label>
                  <Select
                    value={createRoomForm.timePerQuestion.toString()}
                    onValueChange={(value) => setCreateRoomForm(prev => ({ ...prev, timePerQuestion: parseInt(value) }))}
                  >
                    <SelectTrigger className="bg-game-darker border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-game-darker border-gray-600">
                      <SelectItem value="10">10 сек</SelectItem>
                      <SelectItem value="30">30 сек</SelectItem>
                      <SelectItem value="60">60 сек</SelectItem>
                      <SelectItem value="0">Без лимита</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="category">Категория</Label>
                <Select
                  value={createRoomForm.category}
                  onValueChange={(value) => setCreateRoomForm(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="bg-game-darker border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-game-darker border-gray-600">
                    <SelectItem value="general">Общие вопросы</SelectItem>
                    <SelectItem value="top_250">Топ 250 фильмов</SelectItem>
                    <SelectItem value="by_year">По годам</SelectItem>
                    <SelectItem value="by_genre">По жанрам</SelectItem>
                    <SelectItem value="by_actor">По актерам</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPrivate"
                  checked={createRoomForm.isPrivate}
                  onCheckedChange={(checked) => setCreateRoomForm(prev => ({ ...prev, isPrivate: !!checked }))}
                />
                <Label htmlFor="isPrivate">Приватная комната</Label>
              </div>

              {createRoomForm.isPrivate && (
                <div>
                  <Label htmlFor="password">Пароль</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Введите пароль"
                    value={createRoomForm.password}
                    onChange={(e) => setCreateRoomForm(prev => ({ ...prev, password: e.target.value }))}
                    className="bg-game-darker border-gray-600 text-white placeholder-gray-400 focus:border-game-purple"
                  />
                </div>
              )}

              <Button
                onClick={handleCreateRoom}
                disabled={createRoomMutation.isPending}
                className="w-full game-button-green py-3"
              >
                {createRoomMutation.isPending ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                ) : (
                  <Plus className="mr-2" />
                )}
                Создать комнату
              </Button>
            </CardContent>
          </Card>

          {/* Available Rooms */}
          <Card className="game-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Search className="mr-3 text-game-blue" />
                  Доступные комнаты
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => refetchRooms()}
                  disabled={roomsLoading}
                  className="text-gray-400 hover:text-white"
                >
                  <RefreshCw className={`w-4 h-4 ${roomsLoading ? 'animate-spin' : ''}`} />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {roomsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-game-blue border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-400">Загружаем комнаты...</p>
                </div>
              ) : rooms && rooms.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {rooms.map((room: any) => (
                    <Card
                      key={room.id}
                      className="bg-game-darker border-gray-600 hover:border-game-blue transition-colors cursor-pointer"
                      onClick={() => handleJoinRoom(room.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center">
                            <h4 className="font-semibold">{room.name}</h4>
                            {room.isPrivate && (
                              <Lock className="w-4 h-4 text-game-orange ml-2" />
                            )}
                          </div>
                          <Badge
                            variant="secondary"
                            className={`${
                              room.currentPlayers >= room.maxPlayers
                                ? "bg-red-500/20 text-red-400"
                                : room.currentPlayers >= room.maxPlayers * 0.75
                                ? "bg-game-orange/20 text-game-orange"
                                : "bg-game-green/20 text-game-green"
                            }`}
                          >
                            {room.currentPlayers}/{room.maxPlayers}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-400 mb-2 flex items-center gap-4">
                          <span className="flex items-center">
                            <Crown className="w-4 h-4 mr-1" />
                            Хост: {room.host?.firstName || "Игрок"}
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {room.timePerQuestion === 0 ? "∞" : `${room.timePerQuestion}с`}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Категория: {getCategoryText(room.category)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Нет доступных комнат</h3>
                  <p className="text-gray-400 text-sm">Создайте новую комнату или подождите, пока другие игроки создадут комнаты</p>
                </div>
              )}

              <Separator className="my-4 bg-gray-700" />

              <Button
                onClick={() => {
                  // TODO: Implement quick match functionality
                  toast({
                    title: "Скоро будет готово!",
                    description: "Функция быстрой игры будет доступна в ближайшее время",
                  });
                }}
                className="w-full game-button-blue py-3"
              >
                <Zap className="mr-2" />
                Быстрая игра
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Info Section */}
        <Card className="game-card mt-8">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <Settings className="w-8 h-8 text-game-purple mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Настраиваемые правила</h3>
                <p className="text-sm text-gray-400">Выбирайте время ответа, количество игроков и категории вопросов</p>
              </div>
              <div>
                <UserCheck className="w-8 h-8 text-game-green mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Приватные комнаты</h3>
                <p className="text-sm text-gray-400">Создавайте закрытые комнаты с паролем для игры с друзьями</p>
              </div>
              <div>
                <Eye className="w-8 h-8 text-game-blue mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Режим наблюдателя</h3>
                <p className="text-sm text-gray-400">Смотрите за игрой других игроков и учитесь у лучших</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
