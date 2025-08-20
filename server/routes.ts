import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { v4 as uuidv4 } from "uuid";
// @ts-ignore
import YooKassa from "yookassa";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertGameSessionSchema, 
  insertMultiplayerRoomSchema,
  insertQuestionSchema 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Инициализируем YooKassa, если доступны секреты
  let yookassa: any = null;
  if (process.env.YOOKASSA_SHOP_ID && process.env.YOOKASSA_SECRET_KEY) {
    yookassa = new YooKassa({
      shopId: process.env.YOOKASSA_SHOP_ID,
      secretKey: process.env.YOOKASSA_SECRET_KEY
    });
  }
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Профиль пользователя
  app.get('/api/users/:userId/profile', isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  app.put('/api/users/:userId/profile', isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const profileData = req.body;
      
      // Проверяем, что пользователь может редактировать только свой профиль
      if ((req.user as any).claims.sub !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const user = await storage.updateUserProfile(userId, profileData);
      res.json(user);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update user profile" });
    }
  });

  // Question routes - безопасные (без правильных ответов)
  app.get('/api/questions/:category', async (req, res) => {
    try {
      const { category } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;
      const questions = await storage.getQuestionsForGame(limit, category);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  app.get('/api/questions', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const category = req.query.category as string;
      const questions = await storage.getQuestionsForGame(limit, category);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  // Проверка ответа на бэкенде
  app.post('/api/questions/:questionId/check-answer', async (req, res) => {
    try {
      const { questionId } = req.params;
      const { answer } = req.body;
      
      if (!answer) {
        return res.json({ isCorrect: false });
      }
      
      const isCorrect = await storage.checkAnswer(questionId, answer);
      res.json({ isCorrect });
    } catch (error) {
      console.error("Error checking answer:", error);
      res.status(500).json({ message: "Failed to check answer" });
    }
  });

  app.post('/api/questions', isAuthenticated, async (req, res) => {
    try {
      const questionData = insertQuestionSchema.parse(req.body);
      const question = await storage.createQuestion(questionData);
      res.json(question);
    } catch (error) {
      console.error("Error creating question:", error);
      res.status(500).json({ message: "Failed to create question" });
    }
  });

  // Game session routes
  app.post('/api/game-sessions', async (req, res) => {
    try {
      const sessionData = insertGameSessionSchema.parse(req.body);
      
      // If user is authenticated, use their ID
      if (req.isAuthenticated && req.isAuthenticated()) {
        sessionData.userId = (req.user as any).claims.sub;
      }
      
      const session = await storage.createGameSession(sessionData);
      res.json(session);
    } catch (error) {
      console.error("Error creating game session:", error);
      res.status(500).json({ message: "Failed to create game session" });
    }
  });

  app.put('/api/game-sessions/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // If completing a game and user is authenticated, update their stats
      if (updates.isCompleted && req.isAuthenticated && req.isAuthenticated()) {
        const userId = (req.user as any).claims.sub;
        await storage.updateUserStats(userId, updates.score || 0);
      }
      
      const session = await storage.updateGameSession(id, updates);
      res.json(session);
    } catch (error) {
      console.error("Error updating game session:", error);
      res.status(500).json({ message: "Failed to update game session" });
    }
  });

  app.get('/api/game-sessions/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const session = await storage.getGameSession(id);
      res.json(session);
    } catch (error) {
      console.error("Error fetching game session:", error);
      res.status(500).json({ message: "Failed to fetch game session" });
    }
  });

  app.get('/api/users/:userId/game-sessions', isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const sessions = await storage.getUserGameSessions(userId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching user game sessions:", error);
      res.status(500).json({ message: "Failed to fetch user game sessions" });
    }
  });

  // Leaderboard routes
  app.get('/api/leaderboard', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const leaderboard = await storage.getLeaderboard(limit);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Multiplayer routes
  app.post('/api/rooms', isAuthenticated, async (req, res) => {
    try {
      const roomData = insertMultiplayerRoomSchema.parse(req.body);
      const userId = (req.user as any).claims.sub;
      
      const room = await storage.createRoom({
        ...roomData,
        hostId: userId
      });
      res.json(room);
    } catch (error) {
      console.error("Error creating room:", error);
      res.status(500).json({ message: "Failed to create room" });
    }
  });

  app.get('/api/rooms', async (req, res) => {
    try {
      const includePrivate = req.query.includePrivate === 'true';
      const rooms = await storage.getRooms(includePrivate);
      res.json(rooms);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      res.status(500).json({ message: "Failed to fetch rooms" });
    }
  });

  app.get('/api/rooms/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const room = await storage.getRoom(id);
      res.json(room);
    } catch (error) {
      console.error("Error fetching room:", error);
      res.status(500).json({ message: "Failed to fetch room" });
    }
  });

  app.post('/api/rooms/:id/join', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req.user as any).claims.sub;
      
      const participant = await storage.joinRoom(id, userId);
      
      // Обновляем количество игроков в комнате
      await storage.updateRoomPlayerCount(id);
      
      res.json(participant);
    } catch (error) {
      console.error("Error joining room:", error);
      res.status(500).json({ message: "Failed to join room" });
    }
  });

  app.post('/api/rooms/:id/leave', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req.user as any).claims.sub;
      
      await storage.leaveRoom(id, userId);
      
      // Обновляем количество игроков в комнате
      await storage.updateRoomPlayerCount(id);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error leaving room:", error);
      res.status(500).json({ message: "Failed to leave room" });
    }
  });

  app.get('/api/rooms/:id/participants', async (req, res) => {
    try {
      const { id } = req.params;
      const participants = await storage.getRoomParticipants(id);
      res.json(participants);
    } catch (error) {
      console.error("Error fetching room participants:", error);
      res.status(500).json({ message: "Failed to fetch room participants" });
    }
  });

  // Shop and inventory routes
  app.get('/api/users/:userId/inventory', isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const inventory = await storage.getUserInventory(userId);
      res.json(inventory);
    } catch (error) {
      console.error("Error fetching user inventory:", error);
      res.status(500).json({ message: "Failed to fetch user inventory" });
    }
  });

  // Быстрая игра - автоматический поиск комнаты
  app.post('/api/quick-match', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const { gameMode, category } = req.body;
      
      // Пытаемся найти свободную комнату
      let availableRoom = await storage.findAvailableRoom(gameMode, category);
      
      if (!availableRoom) {
        // Создаем новую комнату
        availableRoom = await storage.createRoom({
          name: `Быстрая игра #${Math.floor(Math.random() * 1000)}`,
          hostId: userId,
          gameMode,
          category,
          isPrivate: false,
          maxPlayers: 4
        });
      } else {
        // Присоединяемся к существующей комнате
        await storage.joinRoom(availableRoom.id, userId);
        await storage.updateRoomPlayerCount(availableRoom.id);
      }
      
      res.json({ room: availableRoom });
    } catch (error) {
      console.error("Error in quick match:", error);
      res.status(500).json({ message: "Failed to find or create room" });
    }
  });

  // Создание платежа YooKassa
  app.post('/api/create-payment', isAuthenticated, async (req, res) => {
    try {
      const { amount, coins, description } = req.body;
      const userId = (req.user as any).claims.sub;
      
      if (!yookassa) {
        return res.status(500).json({ message: "YooKassa not configured" });
      }
      
      const paymentData = {
        amount: {
          value: amount.toString(),
          currency: 'RUB'
        },
        confirmation: {
          type: 'redirect',
          return_url: `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/shop?payment=success`
        },
        capture: true,
        description: description || `Покупка ${coins} монет`,
        metadata: {
          userId,
          coins: coins.toString()
        }
      };
      
      const payment = await yookassa.createPayment(paymentData, uuidv4());
      if (!payment.confirmation?.confirmation_url) {
        throw new Error('Payment confirmation URL not received');
      }
      res.json({ confirmationUrl: payment.confirmation?.confirmation_url });
    } catch (error) {
      console.error("Error creating payment:", error);
      res.status(500).json({ message: "Failed to create payment" });
    }
  });
  
  // Webhook для получения уведомлений о платежах
  app.post('/api/payment-webhook', async (req, res) => {
    try {
      console.log('Payment webhook received:', JSON.stringify(req.body, null, 2));
      
      const payment = req.body.object || req.body;
      
      if (payment && payment.status === 'succeeded') {
        const userId = payment.metadata?.userId;
        const coins = parseInt(payment.metadata?.coins || '0');
        
        if (userId && coins > 0) {
          // Добавляем монеты пользователю
          const user = await storage.getUser(userId);
          if (user) {
            await storage.updateUserCoins(userId, (user.coins || 0) + coins);
            console.log(`✅ Добавлено ${coins} монет пользователю ${userId}`);
          } else {
            console.error(`❌ Пользователь ${userId} не найден`);
          }
        } else {
          console.error('❌ Не хватает данных в metadata:', { userId, coins });
        }
      } else {
        console.log('⏳ Платеж еще не завершен или данные некорректные');
      }
      
      res.status(200).send('OK');
    } catch (error) {
      console.error("❌ Error processing payment webhook:", error);
      res.status(500).json({ message: "Failed to process payment" });
    }
  });

  app.post('/api/users/:userId/buy-coins', isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const { amount, coins } = req.body;
      
      // Если YooKassa настроена, используем её
      if (yookassa) {
        return res.status(400).json({ 
          message: "Use /api/create-payment endpoint for purchases",
          usePaymentFlow: true 
        });
      }
      
      // Fallback для разработки без YooKassa
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      await storage.updateUserCoins(userId, (user.coins || 0) + coins);
      res.json({ success: true, newBalance: (user.coins || 0) + coins });
    } catch (error) {
      console.error("Error buying coins:", error);
      res.status(500).json({ message: "Failed to buy coins" });
    }
  });

  app.post('/api/users/:userId/buy-item', isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const { itemType, quantity, cost } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user || (user.coins || 0) < cost) {
        return res.status(400).json({ message: "Insufficient coins" });
      }
      
      await storage.updateUserCoins(userId, (user.coins || 0) - cost);
      await storage.addToInventory(userId, itemType, quantity);
      
      res.json({ success: true, newBalance: (user.coins || 0) - cost });
    } catch (error) {
      console.error("Error buying item:", error);
      res.status(500).json({ message: "Failed to buy item" });
    }
  });

  app.post('/api/users/:userId/use-item', isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const { itemType, quantity } = req.body;
      
      const success = await storage.useInventoryItem(userId, itemType, quantity);
      res.json({ success });
    } catch (error) {
      console.error("Error using item:", error);
      res.status(500).json({ message: "Failed to use item" });
    }
  });

  const httpServer = createServer(app);
  
  // Добавляем WebSocket сервер для мультиплеера
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Храним соединения по комнатам
  const roomConnections = new Map<string, Map<string, WebSocket>>();
  const userRooms = new Map<string, string>();

  wss.on('connection', (ws, request) => {
    console.log('Новое WebSocket соединение');
    
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        const { type, roomId, userId, payload } = message;
        
        switch (type) {
          case 'join_room':
            // Подключаем пользователя к комнате
            if (!roomConnections.has(roomId)) {
              roomConnections.set(roomId, new Map());
            }
            roomConnections.get(roomId)?.set(userId, ws);
            userRooms.set(userId, roomId);
            
            // Уведомляем всех в комнате
            broadcastToRoom(roomId, {
              type: 'user_joined',
              userId,
              payload: await storage.getRoomParticipants(roomId)
            });
            break;
            
          case 'leave_room':
            // Отключаем пользователя от комнаты
            roomConnections.get(roomId)?.delete(userId);
            userRooms.delete(userId);
            
            broadcastToRoom(roomId, {
              type: 'user_left',
              userId,
              payload: await storage.getRoomParticipants(roomId)
            });
            break;
            
          case 'game_start':
            // Запуск игры
            const gameQuestions = await storage.getQuestionsForGame(10, payload?.category);
            broadcastToRoom(roomId, {
              type: 'game_started',
              payload: { questions: gameQuestions }
            });
            break;
            
          case 'submit_answer':
            // Обработка ответа
            const { questionId, answer } = payload;
            const isCorrect = await storage.checkAnswer(questionId, answer);
            
            // Отправляем результат только отправителю
            ws.send(JSON.stringify({
              type: 'answer_result',
              payload: { isCorrect, questionId }
            }));
            
            // Уведомляем всех о том, что игрок ответил
            broadcastToRoom(roomId, {
              type: 'player_answered',
              userId,
              payload: { questionId }
            });
            break;
            
          case 'next_question':
            // Переход к следующему вопросу
            broadcastToRoom(roomId, {
              type: 'next_question',
              payload
            });
            break;
        }
      } catch (error) {
        console.error('WebSocket ошибка:', error);
      }
    });
    
    ws.on('close', () => {
      // Очищаем соединения
      userRooms.forEach((roomId, userId) => {
        if (roomConnections.get(roomId)?.get(userId) === ws) {
          roomConnections.get(roomId)?.delete(userId);
          userRooms.delete(userId);
          
          // Уведомляем о отключении
          storage.getRoomParticipants(roomId).then(participants => {
            broadcastToRoom(roomId, {
              type: 'user_left',
              userId,
              payload: participants
            });
          });
          return;
        }
      });
    });
  });
  
  function broadcastToRoom(roomId: string, message: any) {
    const roomWs = roomConnections.get(roomId);
    if (roomWs) {
      const messageStr = JSON.stringify(message);
      roomWs.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(messageStr);
        }
      });
    }
  }
  
  return httpServer;
}
