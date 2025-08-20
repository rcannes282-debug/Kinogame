import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GameModeCard from "@/components/GameModeCard";
import { Clock, Trophy, Infinity, Users, Plus, Search, Star } from "lucide-react";
import { Link } from "wouter";

export default function Landing() {
  const gameModes = [
    {
      title: "На время",
      description: "Отвечай быстро на вопросы о фильмах",
      icon: Clock,
      features: ["Вопросы по годам", "По жанрам", "По актерам"],
      buttonText: "Играть",
      buttonColor: "purple" as const,
      onPlay: () => window.location.href = "/api/login",
    },
    {
      title: "Топ 250",
      description: "Вопросы о лучших фильмах всех времен",
      icon: Trophy,
      features: ["Классические фильмы", "Современные хиты", "Мировое кино"],
      buttonText: "Играть",
      buttonColor: "orange" as const,
      onPlay: () => window.location.href = "/api/login",
    },
    {
      title: "Бесконечность",
      description: "Играй пока не потратишь 5 жизней",
      icon: Infinity,
      features: ["5 жизней", "Набирай максимум очков", "Покупка жизней"],
      buttonText: "Играть",
      buttonColor: "green" as const,
      onPlay: () => window.location.href = "/api/login",
    },
  ];

  return (
    <div className="min-h-screen bg-game-darker text-white">
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-game-purple/20 via-game-dark to-game-blue/20"></div>
        <div className="absolute inset-0 bg-black/40"></div>
        
        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-game-purple to-game-blue bg-clip-text text-transparent">
            KinoGame
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Проверь свои знания о кино в увлекательной игре! Отвечай на вопросы о фильмах и соревнуйся с друзьями.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button asChild className="game-button-purple px-8 py-4 text-lg shadow-lg hover:shadow-purple-500/25">
              <a href="/api/login">
                Одиночная игра
              </a>
            </Button>
            <Button asChild className="game-button-blue px-8 py-4 text-lg shadow-lg hover:shadow-blue-500/25">
              <a href="/api/login">
                <Users className="mr-2" />
                Мультиплеер
              </a>
            </Button>
            <Button asChild variant="outline" className="border-2 border-gray-600 hover:border-white text-gray-300 hover:text-white px-8 py-4 text-lg">
              <Link href="/game/guest">
                Играть без регистрации
              </Link>
            </Button>
          </div>

          {/* Game Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-game-green">12,847</div>
              <div className="text-gray-400">Игроков</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-game-orange">50,000+</div>
              <div className="text-gray-400">Вопросов</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-game-blue">156,230</div>
              <div className="text-gray-400">Игр сыграно</div>
            </div>
          </div>
        </div>
      </section>

      {/* Game Modes Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Режимы игры</h2>
          <p className="text-xl text-gray-400">Выбери свой любимый способ играть</p>
        </div>

        {/* Single Player Modes */}
        <div className="mb-16">
          <h3 className="text-2xl font-semibold mb-8 text-center">
            Одиночная игра
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {gameModes.map((mode) => (
              <GameModeCard key={mode.title} {...mode} />
            ))}
          </div>
        </div>

        {/* Multiplayer Section Preview */}
        <div>
          <h3 className="text-2xl font-semibold mb-8 text-center">
            <Users className="inline mr-2 text-game-blue" />
            Мультиплеер
          </h3>
          <Card className="bg-gradient-to-r from-game-blue/20 to-game-purple/20 game-card border-gray-700">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="mb-6">
                  <Users className="w-16 h-16 text-game-blue mb-4 mx-auto" />
                  <h4 className="text-2xl font-semibold mb-2">Играй с друзьями онлайн</h4>
                  <p className="text-gray-300">Создавай комнаты, соревнуйся с игроками со всего мира</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  <div className="bg-game-dark/50 rounded-xl p-4">
                    <Plus className="w-6 h-6 text-game-green mb-2 mx-auto" />
                    <div className="font-semibold">Создать комнату</div>
                    <div className="text-sm text-gray-400">До 8 игроков</div>
                  </div>
                  <div className="bg-game-dark/50 rounded-xl p-4">
                    <Search className="w-6 h-6 text-game-blue mb-2 mx-auto" />
                    <div className="font-semibold">Найти игру</div>
                    <div className="text-sm text-gray-400">Быстрое подключение</div>
                  </div>
                </div>
                <Button asChild className="game-button-blue px-8 py-3">
                  <a href="/api/login">Перейти к мультиплееру</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Sample Game Interface */}
      <section className="py-20 bg-game-dark/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Как играть</h2>
            <p className="text-xl text-gray-400">Пример игрового интерфейса</p>
          </div>

          <Card className="game-card p-8 shadow-2xl">
            <CardContent className="p-0">
              {/* Demo Game Interface */}
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center space-x-4">
                  <div className="text-lg font-semibold">Вопрос 5/10</div>
                  <div className="flex items-center space-x-1">
                    {Array(3).fill(0).map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-red-500 fill-red-500" />
                    ))}
                    {Array(2).fill(0).map((_, i) => (
                      <Star key={i + 3} className="w-5 h-5 text-gray-600" />
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-game-green">1,250</div>
                  <div className="text-sm text-gray-400">очков</div>
                </div>
              </div>

              <div className="text-center mb-8">
                <h3 className="text-2xl font-semibold mb-4">
                  В каком году был снят фильм "Криминальное чтиво" Квентина Тарантино?
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {["1992", "1994", "1996", "1998"].map((answer, index) => (
                  <div
                    key={index}
                    className="bg-game-darker border-2 border-gray-600 text-left p-4 rounded-xl cursor-pointer hover:border-game-purple transition-all"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-game-purple/20 border border-game-purple rounded-full flex items-center justify-center mr-3 font-semibold">
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span>{answer}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}
