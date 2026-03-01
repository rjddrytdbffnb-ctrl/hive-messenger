// src/services/chatBots.ts
// Сервис для автоматических ответов ботов (для тестирования)

interface BotResponse {
  text: string;
  delay: number; // задержка в мс
}

interface Bot {
  id: string;
  name: string;
  avatar: string;
  responses: string[];
  reactionChance: number; // вероятность ответа (0-1)
}

// Определение ботов
export const BOTS: Bot[] = [
  {
    id: 'bot_alex',
    name: 'Алексей Иванов',
    avatar: 'АИ',
    responses: [
      'Привет! Как дела?',
      'Отличная идея! 👍',
      'Давайте обсудим это на встрече',
      'Согласен, нужно подумать',
      'Уже работаю над этим',
      'Отправил файлы в общий чат',
      'Спасибо за информацию!',
      'Хорошо, займусь этим',
      'Есть вопросы по проекту?',
      'Всё понятно, спасибо!',
    ],
    reactionChance: 0.7
  },
  {
    id: 'bot_maria',
    name: 'Мария Петрова',
    avatar: 'МП',
    responses: [
      'Отличная работа! 🎉',
      'Нужно уточнить детали',
      'Я подготовлю презентацию',
      'Когда планируем запуск?',
      'Добавила в календарь',
      'Согласовала с руководством',
      'Супер! Продолжаем в том же духе',
      'Есть несколько предложений',
      'Давайте созвонимся?',
      'Отправила план на почту',
    ],
    reactionChance: 0.6
  },
  {
    id: 'bot_dmitry',
    name: 'Дмитрий Сидоров',
    avatar: 'ДС',
    responses: [
      'Хорошо, учту',
      'Нужно больше времени',
      'Уже в работе',
      'Сделаю до конца дня',
      'Есть технические вопросы',
      'Проверил - всё работает',
      'Нашёл баг, исправляю',
      'Готово! ✅',
      'Отличный результат',
      'Запушил в репозиторий',
    ],
    reactionChance: 0.5
  },
  {
    id: 'bot_elena',
    name: 'Елена Смирнова',
    avatar: 'ЕС',
    responses: [
      'Записала в задачи',
      'Буду на встрече',
      'Подготовила документы',
      'Всё согласовано',
      'Отправила приглашения',
      'Хороший вопрос!',
      'Уточню и отвечу',
      'Спасибо за напоминание',
      'Уже в курсе ситуации',
      'Держу в приоритете',
    ],
    reactionChance: 0.8
  }
];

// Функция для получения случайного ответа от бота
export const getBotResponse = (botId: string): BotResponse | null => {
  const bot = BOTS.find(b => b.id === botId);
  if (!bot) return null;

  // Проверяем, ответит ли бот (случайность)
  if (Math.random() > bot.reactionChance) {
    return null;
  }

  // Выбираем случайный ответ
  const randomResponse = bot.responses[Math.floor(Math.random() * bot.responses.length)];
  
  // Случайная задержка 1-5 секунд
  const delay = 1000 + Math.random() * 4000;

  return {
    text: randomResponse,
    delay: Math.floor(delay)
  };
};

// Функция для получения всех ID ботов
export const getBotIds = (): string[] => {
  return BOTS.map(b => b.id);
};

// Функция для проверки, является ли пользователь ботом
export const isBot = (userId: string): boolean => {
  return getBotIds().includes(userId);
};

// Функция для получения информации о боте
export const getBotInfo = (botId: string) => {
  return BOTS.find(b => b.id === botId);
};

// Более сложные ответы с контекстом
interface SmartBotResponse {
  trigger: RegExp;
  responses: string[];
}

const SMART_RESPONSES: SmartBotResponse[] = [
  {
    trigger: /(привет|здравствуй|hi|hello)/i,
    responses: [
      'Привет! Как дела? 👋',
      'Здравствуйте!',
      'Привет! Чем могу помочь?',
      'Приветствую! 😊',
    ]
  },
  {
    trigger: /(спасибо|thanks|благодар)/i,
    responses: [
      'Пожалуйста! 😊',
      'Всегда рад помочь!',
      'Не за что!',
      'Обращайтесь! 👍',
    ]
  },
  {
    trigger: /(как дела|как ты|how are you)/i,
    responses: [
      'Отлично! Работаю над проектом',
      'Всё хорошо, спасибо!',
      'Нормально, много задач',
      'Супер! А у тебя?',
    ]
  },
  {
    trigger: /(встреча|собрание|meeting)/i,
    responses: [
      'Хорошо, буду на встрече',
      'Во сколько планируем?',
      'Добавил в календарь',
      'Подтверждаю участие ✅',
    ]
  },
  {
    trigger: /(срочно|urgent|asap)/i,
    responses: [
      'Понял, делаю в приоритете',
      'Сделаю максимально быстро',
      'Уже занимаюсь!',
      'Постараюсь сделать сегодня',
    ]
  },
  {
    trigger: /(помощ|help|проблем)/i,
    responses: [
      'Чем могу помочь?',
      'Расскажи подробнее',
      'Какая именно проблема?',
      'Давай разберёмся вместе',
    ]
  },
  {
    trigger: /(отлично|супер|круто|great|awesome)/i,
    responses: [
      'Рад что помог! 🎉',
      'Спасибо! 😊',
      'Да, получилось неплохо!',
      'Команда постаралась! 💪',
    ]
  },
];

// Умный ответ бота на основе контекста сообщения
export const getSmartBotResponse = (botId: string, userMessage: string): BotResponse | null => {
  const bot = BOTS.find(b => b.id === botId);
  if (!bot) return null;

  // Проверяем вероятность ответа
  if (Math.random() > bot.reactionChance) {
    return null;
  }

  // Ищем подходящий контекстный ответ
  for (const smartResponse of SMART_RESPONSES) {
    if (smartResponse.trigger.test(userMessage)) {
      const randomResponse = smartResponse.responses[
        Math.floor(Math.random() * smartResponse.responses.length)
      ];
      
      const delay = 1500 + Math.random() * 3000;
      
      return {
        text: randomResponse,
        delay: Math.floor(delay)
      };
    }
  }

  // Если контекстный ответ не найден, возвращаем случайный
  return getBotResponse(botId);
};

// Эмуляция "печатает..."
export const simulateTyping = (callback: (isTyping: boolean) => void, duration: number) => {
  callback(true);
  setTimeout(() => {
    callback(false);
  }, duration);
};

export default {
  BOTS,
  getBotResponse,
  getSmartBotResponse,
  getBotIds,
  isBot,
  getBotInfo,
  simulateTyping
};
