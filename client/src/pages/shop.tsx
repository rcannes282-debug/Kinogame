import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { 
  Store, 
  Coins, 
  Heart, 
  Divide, 
  Clock, 
  Gift, 
  ShoppingCart,
  CreditCard,
  Package,
  Info,
  Zap,
  Star
} from "lucide-react";

interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  price: number;
  bonus?: number;
  popular?: boolean;
  premium?: boolean;
}

interface GameItem {
  id: string;
  name: string;
  description: string;
  itemType: string;
  cost: number;
  icon: any;
  color: string;
}

export default function Shop() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  
  // Обрабатываем возврат с платёжной страницы
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    
    if (paymentStatus === 'success') {
      toast({
        title: "Платёж успешен!",
        description: "Монеты будут зачислены в течение нескольких минут",
        duration: 5000,
      });
      // Очищаем URL
      window.history.replaceState({}, '', '/shop');
      // Обновляем баланс пользователя
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    } else if (paymentStatus === 'cancel') {
      toast({
        title: "Платёж отменён",
        description: "Оплата была отменена",
        variant: "destructive",
      });
      window.history.replaceState({}, '', '/shop');
    }
  }, [location, toast, queryClient]);

  // Fetch user inventory
  const { data: inventory } = useQuery<any[]>({
    queryKey: ["/api/users", user?.id, "inventory"],
    enabled: !!user?.id && isAuthenticated,
  });

  // Buy coins mutation
  const buyCoinsMutation = useMutation({
    mutationFn: async ({ packageData }: { packageData: CoinPackage }) => {
      if (!user?.id) throw new Error("User not authenticated");
      const response = await apiRequest("POST", "/api/create-payment", {
        amount: packageData.price,
        coins: packageData.coins,
        description: `Покупка ${packageData.name} - ${packageData.coins} монет`
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.confirmationUrl) {
        // Перенаправляем на страницу оплаты YooKassa
        window.location.href = data.confirmationUrl;
      } else {
        toast({
          title: "Покупка успешна!",
          description: "Монеты добавлены на ваш счет",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      }
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
        title: "Ошибка покупки",
        description: "Не удалось создать платёж. Попробуйте позже.",
        variant: "destructive",
      });
    },
  });

  // Buy item mutation
  const buyItemMutation = useMutation({
    mutationFn: async ({ item }: { item: GameItem }) => {
      if (!user?.id) throw new Error("User not authenticated");
      return apiRequest("POST", `/api/users/${user.id}/buy-item`, {
        itemType: item.itemType,
        quantity: 1,
        cost: item.cost,
      });
    },
    onSuccess: (_, { item }) => {
      toast({
        title: "Предмет куплен!",
        description: `${item.name} добавлен в ваш инвентарь`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "inventory"] });
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
        title: "Ошибка покупки",
        description: "Недостаточно монет или произошла ошибка",
        variant: "destructive",
      });
    },
  });

  const coinPackages: CoinPackage[] = [
    {
      id: "starter",
      name: "Стартовый пакет",
      coins: 1000,
      price: 99,
    },
    {
      id: "popular",
      name: "Популярный пакет",
      coins: 6000,
      price: 499,
      bonus: 20,
      popular: true,
    },
    {
      id: "premium",
      name: "Премиум пакет",
      coins: 15000,
      price: 999,
      bonus: 50,
      premium: true,
    },
  ];

  const gameItems: GameItem[] = [
    {
      id: "extra_life",
      name: "Дополнительная жизнь",
      description: "Для режима \"Бесконечность\"",
      itemType: "extra_life",
      cost: 50,
      icon: Heart,
      color: "text-red-500",
    },
    {
      id: "50_50",
      name: "50/50 подсказка",
      description: "Убирает 2 неправильных ответа",
      itemType: "50_50",
      cost: 100,
      icon: Divide,
      color: "text-game-green",
    },
    {
      id: "extra_time",
      name: "Дополнительное время",
      description: "+30 секунд к таймеру",
      itemType: "extra_time",
      cost: 75,
      icon: Clock,
      color: "text-game-blue",
    },
  ];

  const handleBuyCoins = (packageData: CoinPackage) => {
    if (!isAuthenticated) {
      toast({
        title: "Требуется авторизация",
        description: "Войдите в систему для покупки монет",
        variant: "destructive",
      });
      return;
    }

    buyCoinsMutation.mutate({ packageData });
  };

  const handleBuyItem = (item: GameItem) => {
    if (!isAuthenticated) {
      toast({
        title: "Требуется авторизация",
        description: "Войдите в систему для покупки предметов",
        variant: "destructive",
      });
      return;
    }

    if (!user?.coins || user.coins < item.cost) {
      toast({
        title: "Недостаточно монет",
        description: "Купите монеты для покупки этого предмета",
        variant: "destructive",
      });
      return;
    }

    buyItemMutation.mutate({ item });
  };

  const getItemQuantity = (itemType: string) => {
    if (!inventory) return 0;
    const item = inventory.find((i: any) => i.itemType === itemType);
    return item?.quantity || 0;
  };

  return (
    <div className="min-h-screen bg-game-darker text-white">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center">
            <Store className="mr-3 text-game-orange" />
            Магазин
          </h1>
          <p className="text-xl text-gray-400">Покупай монеты и улучшения</p>
          
          {isAuthenticated && user && (
            <div className="mt-6">
              <Card className="inline-block bg-game-orange/20 border-game-orange/30">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Coins className="w-8 h-8 text-game-orange" />
                    <div>
                      <div className="text-2xl font-bold text-game-orange">
                        {user.coins?.toLocaleString() || "0"}
                      </div>
                      <div className="text-sm text-gray-300">Ваш баланс</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Currency Packages */}
          <Card className="game-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Coins className="mr-3 text-game-orange" />
                Игровые монеты
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {coinPackages.map((pkg) => (
                <Card
                  key={pkg.id}
                  className={`bg-game-darker border-gray-600 hover:border-game-orange transition-colors relative ${
                    pkg.popular ? "ring-2 ring-game-green" : ""
                  } ${pkg.premium ? "ring-2 ring-game-purple" : ""}`}
                >
                  {pkg.popular && (
                    <Badge className="absolute -top-2 left-4 bg-game-green text-white">
                      Популярный
                    </Badge>
                  )}
                  {pkg.premium && (
                    <Badge className="absolute -top-2 left-4 bg-game-purple text-white">
                      Премиум
                    </Badge>
                  )}
                  {pkg.bonus && (
                    <Badge className="absolute -top-2 -right-2 bg-game-green text-white">
                      +{pkg.bonus}%
                    </Badge>
                  )}
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4">
                        <Coins className="text-game-orange text-3xl" />
                        <div>
                          <div className="font-semibold">
                            {pkg.coins.toLocaleString()} монет
                          </div>
                          <div className="text-sm text-gray-400">{pkg.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{pkg.price} ₽</div>
                        <Button
                          onClick={() => handleBuyCoins(pkg)}
                          disabled={buyCoinsMutation.isPending}
                          className="game-button-orange text-sm px-4 py-2"
                        >
                          {buyCoinsMutation.isPending ? (
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                          ) : (
                            <>
                              <CreditCard className="w-4 h-4 mr-1" />
                              Купить
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Alert className="bg-game-blue/20 border-game-blue">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Оплата производится через безопасную систему YooKassa. Монеты поступают мгновенно.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* In-Game Items */}
          <Card className="game-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Gift className="mr-3 text-game-purple" />
                Игровые предметы
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {gameItems.map((item) => {
                const Icon = item.icon;
                const quantity = getItemQuantity(item.itemType);
                const canAfford = user?.coins && user.coins >= item.cost;
                
                return (
                  <Card
                    key={item.id}
                    className="bg-game-darker border-gray-600 hover:border-game-purple transition-colors"
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                          <Icon className={`text-2xl ${item.color}`} />
                          <div>
                            <div className="font-semibold flex items-center">
                              {item.name}
                              {quantity > 0 && (
                                <Badge variant="secondary" className="ml-2 bg-gray-600">
                                  {quantity}
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-400">{item.description}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-game-orange flex items-center">
                            <Coins className="w-4 h-4 mr-1" />
                            {item.cost}
                          </div>
                          <Button
                            onClick={() => handleBuyItem(item)}
                            disabled={!canAfford || buyItemMutation.isPending}
                            className={`game-button-purple text-sm px-4 py-2 ${
                              !canAfford ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                          >
                            {buyItemMutation.isPending ? (
                              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                            ) : (
                              <>
                                <ShoppingCart className="w-4 h-4 mr-1" />
                                Купить
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              <Alert className="bg-game-blue/20 border-game-blue">
                <Package className="h-4 w-4" />
                <AlertDescription>
                  Предметы можно использовать во время игры. Они автоматически добавляются в ваш инвентарь.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>

        {/* Special Offers */}
        <Card className="game-card mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="mr-3 text-game-orange" />
              Специальные предложения
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-r from-game-purple/20 to-game-blue/20 p-6 rounded-xl border border-gray-600">
                <div className="flex items-center mb-4">
                  <Zap className="w-8 h-8 text-game-orange mr-3" />
                  <div>
                    <h3 className="font-semibold">Стартовый бонус</h3>
                    <p className="text-sm text-gray-400">Для новых игроков</p>
                  </div>
                </div>
                <p className="text-sm mb-4">
                  Получите 500 бонусных монет при первой покупке любого пакета!
                </p>
                <Badge className="bg-game-green">Активно</Badge>
              </div>

              <div className="bg-gradient-to-r from-game-green/20 to-game-orange/20 p-6 rounded-xl border border-gray-600">
                <div className="flex items-center mb-4">
                  <Gift className="w-8 h-8 text-game-green mr-3" />
                  <div>
                    <h3 className="font-semibold">Ежедневный бонус</h3>
                    <p className="text-sm text-gray-400">Заходи каждый день</p>
                  </div>
                </div>
                <p className="text-sm mb-4">
                  Получайте бесплатные монеты за ежедневный вход в игру!
                </p>
                <Badge className="bg-game-blue">Скоро</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Info */}
        <Card className="game-card mt-8">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="font-semibold mb-4">Безопасная оплата</h3>
              <div className="grid md:grid-cols-3 gap-6 text-sm text-gray-400">
                <div className="flex items-center justify-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  <span>Банковские карты</span>
                </div>
                <div className="flex items-center justify-center">
                  <Package className="w-5 h-5 mr-2" />
                  <span>Электронные кошельки</span>
                </div>
                <div className="flex items-center justify-center">
                  <Info className="w-5 h-5 mr-2" />
                  <span>SSL шифрование</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
