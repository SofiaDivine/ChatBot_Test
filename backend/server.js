// 1. Імпортуємо пакети
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http'); // Модуль HTTP
const { WebSocketServer } = require('ws'); // WebSocket
const axios = require('axios'); // Потрібен для рандомних повідомлень

// 2. Імпортуємо моделі та маршрути
const apiRoutes = require('./routes/api');
const Chat = require('./models/Chat');
const Message = require('./models/Message');

// 3. Завантажуємо .env
dotenv.config();

// 4. Ініціалізуємо Express
const app = express();
app.use(cors());
app.use(express.json());

// 5. Створюємо HTTP-сервер з нашого Express-додатку
const server = http.createServer(app);

// 6. Створюємо WebSocket-сервер (WSS), прив'язаний до нашого HTTP-сервера
const wss = new WebSocketServer({ server });

// --- Глобальні змінні для WebSocket ---
let isRandomSenderOn = false;
let randomSenderInterval = null;

// Функція для трансляції (broadcast) повідомлення всім підключеним клієнтам
const broadcast = (data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

// Функція для запуску рандомного відправника - ОНОВЛЕНО
const startRandomSender = () => {
  if (randomSenderInterval) return; // Вже запущено

  console.log('Starting random message sender...');
  randomSenderInterval = setInterval(async () => {
    try {
      // Отримуємо всі чати
      const chats = await Chat.find();
      if (chats.length === 0) return;

      const randomChat = chats[Math.floor(Math.random() * chats.length)];

      const quoteResponse = await axios.get('https://dummyjson.com/quotes/random');
      const quoteData = quoteResponse.data;
      const botText = `${quoteData.quote}`;

      // Створюємо та зберігаємо повідомлення бота
      const botMessage = new Message({
        chatId: randomChat._id,
        text: botText,
        sender: 'bot',
      });
      await botMessage.save();

      randomChat.lastMessage = botMessage._id;
      randomChat.updatedAt = Date.now();
      await randomChat.save();

      let populatedChat;
      try {
        populatedChat = await randomChat.populate('lastMessage');
      } catch (e) {
        console.error("Failed to populate randomChat", e);
        populatedChat = randomChat;
      }

      console.log(`Sent random message to ${randomChat.firstName}`);
      broadcast({ type: 'RANDOM_MESSAGE', payload: { message: botMessage, chat: populatedChat } });
      broadcast({ type: 'UPDATED_CHAT', payload: populatedChat });

    } catch (error) {
      console.error('Error in random sender:', error.message);
    }
  }, 30000);
};

const stopRandomSender = () => {
  if (randomSenderInterval) {
    console.log('Stopping random message sender...');
    clearInterval(randomSenderInterval);
    randomSenderInterval = null;
  }
};

//  Обробка підключень до WebSocket
wss.on('connection', (ws) => {
  console.log('Client connected via WebSocket');

  // Надсилаємо новому клієнту поточний статус "рандомного відправника"
  ws.send(JSON.stringify({ type: 'STATUS_UPDATE', payload: { isRandomSenderOn } }));

  // Обробка повідомлень від клієнта
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === 'TOGGLE_RANDOM_SENDER') {
        isRandomSenderOn = !isRandomSenderOn;
        if (isRandomSenderOn) {
          startRandomSender();
        } else {
          stopRandomSender();
        }
        broadcast({ type: 'STATUS_UPDATE', payload: { isRandomSenderOn } });
      }
    } catch (e) {
      console.error('Failed to parse WS message:', e);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected... ');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

const seedDatabase = async () => {
  try {
    const count = await Chat.countDocuments();
    if (count > 0) {
      console.log('Database already contains chats. Skipping seed.');
      return;
    }

    console.log('No chats found. Seeding database...');
    const chatsToSeed = [
      { firstName: 'Mark', lastName: 'Smith', updatedAt: new Date(Date.now() - 3600000 * 1) },
      { firstName: 'John', lastName: 'Miller', updatedAt: new Date(Date.now() - 3600000 * 2) },
      { firstName: 'Vanessa', lastName: 'Cruz', updatedAt: new Date(Date.now() - 3600000 * 3) },
    ];
    await Chat.insertMany(chatsToSeed);
    console.log('Database seeded with 3 chats.');

  } catch (error) {
    console.error('Error seeding database:', error.message);
  }
};

// Запускаємо підключення та посів
connectDB().then(() => {
  seedDatabase();
});

app.use('/api', apiRoutes(broadcast));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server (HTTP + WS) running on http://localhost:${PORT}`);
});

