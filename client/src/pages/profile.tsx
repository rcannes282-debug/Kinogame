import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User, GameSession } from "@shared/schema";
import { Settings, Trophy, Clock, Target, Coins } from "lucide-react";

export default function Profile() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
  });

  // Загружаем профиль пользователя
  const { data: userProfile, isLoading } = useQuery<User>({
    queryKey: ["/api/users", user?.id, "profile"],
    enabled: !!user?.id && isAuthenticated,
  });

  // Загружаем игровые сессии
  const { data: gameSessions } = useQuery<GameSession[]>({
    queryKey: ["/api/users", user?.id, "game-sessions"],
    enabled: !!user?.id && isAuthenticated,
  });

  // Загружаем инвентарь
  const { data: inventory } = useQuery<any[]>({
    queryKey: ["/api/users", user?.id, "inventory"],
    enabled: !!user?.id && isAuthenticated,
  });

  // Мутация для обновления профиля
  const updateProfile = useMutation({
    mutationFn: async (data: any) => {
      if (!user?.id) throw new Error("User not authenticated");
      return apiRequest("PUT", `/api/users/${user.id}/profile`, data);
    },
    onSuccess: () => {
      toast({ title: "Профиль обновлен", description: "Изменения успешно сохранены" });
      setEditMode(false);
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "profile"] });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить профиль",
        variant: "destructive",
      });
    },
  });

  // Инициализация данных профиля
  useState(() => {
    if (userProfile) {
      setProfileData({
        firstName: userProfile.firstName || "",
        lastName: userProfile.lastName || "",
      });
    }
  });

  const handleSaveProfile = () => {
    updateProfile.mutate(profileData);
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="text-center py-8">
              <p>Войдите в систему, чтобы просмотреть профиль</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-white">Загрузка...</div>
        </div>
      </div>
    );
  }

  const stats = {
    totalGames: gameSessions?.length || 0,
    totalScore: userProfile?.totalScore || 0,
    averageScore: gameSessions?.length ? Math.round((userProfile?.totalScore || 0) / gameSessions.length) : 0,
    bestScore: Math.max(...(gameSessions?.map(s => s.score || 0) || [0])),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="h-8 w-8 text-yellow-400" />
            <h1 className="text-3xl font-bold text-white">Профиль</h1>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">Профиль</TabsTrigger>
              <TabsTrigger value="stats">Статистика</TabsTrigger>
              <TabsTrigger value="inventory">Инвентарь</TabsTrigger>
              <TabsTrigger value="settings">Настройки</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Информация о профиле</span>
                    <Button
                      variant={editMode ? "outline" : "default"}
                      onClick={() => editMode ? setEditMode(false) : setEditMode(true)}
                    >
                      {editMode ? "Отменить" : "Редактировать"}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    {userProfile?.profileImageUrl && (
                      <img
                        src={userProfile.profileImageUrl}
                        alt="Аватар"
                        className="w-20 h-20 rounded-full"
                      />
                    )}
                    <div>
                      <h3 className="text-xl font-semibold">
                        {userProfile?.firstName} {userProfile?.lastName}
                      </h3>
                      <p className="text-muted-foreground">{userProfile?.email}</p>
                    </div>
                  </div>

                  {editMode ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="firstName">Имя</Label>
                        <Input
                          id="firstName"
                          value={profileData.firstName}
                          onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Фамилия</Label>
                        <Input
                          id="lastName"
                          value={profileData.lastName}
                          onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                        />
                      </div>
                      <Button onClick={handleSaveProfile} disabled={updateProfile.isPending}>
                        {updateProfile.isPending ? "Сохранение..." : "Сохранить"}
                      </Button>
                    </div>
                  ) : null}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Coins className="h-5 w-5 text-yellow-500" />
                      <span className="font-semibold">{userProfile?.coins || 0} монет</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-blue-500" />
                      <span className="font-semibold">{stats.totalScore} очков</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stats">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      Игровая статистика
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Всего игр:</span>
                      <Badge variant="secondary">{stats.totalGames}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Общий счет:</span>
                      <Badge variant="secondary">{stats.totalScore}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Средний счет:</span>
                      <Badge variant="secondary">{stats.averageScore}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Лучший результат:</span>
                      <Badge variant="secondary">{stats.bestScore}</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Последние игры</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {gameSessions?.slice(0, 5).map((session, index) => (
                      <div key={session.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                        <div>
                          <span className="capitalize">{session.gameMode}</span>
                          {session.category && <span className="text-sm text-muted-foreground ml-2">({session.category})</span>}
                        </div>
                        <Badge variant="outline">{session.score} очков</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="inventory">
              <Card>
                <CardHeader>
                  <CardTitle>Инвентарь</CardTitle>
                  <CardDescription>Ваши игровые предметы и усиления</CardDescription>
                </CardHeader>
                <CardContent>
                  {inventory && inventory.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-3">
                      {inventory.map((item, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <h4 className="font-semibold">{item.itemType}</h4>
                          <p className="text-sm text-muted-foreground">Количество: {item.quantity}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Инвентарь пуст</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Настройки</CardTitle>
                  <CardDescription>Настройки игры и уведомлений</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Настройки будут добавлены в следующих обновлениях</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}