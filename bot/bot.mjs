// Telegram Bot Runner for «Моя сказка»
// Token: 8896052559:AAEBk3qa4vDty9q58NflSuAodEkgQlmqH6k

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8896052559:AAEBk3qa4vDty9q58NflSuAodEkgQlmqH6k';
const WEB_APP_URL = process.env.WEB_APP_URL || 'https://x9x9x9www.github.io/moya-skazka/';

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function callTelegram(method, params = {}) {
  try {
    const res = await fetch(`${TELEGRAM_API}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return await res.json();
  } catch (err) {
    console.error(`[Bot] Ошибка вызова ${method}:`, err.message);
    return null;
  }
}

async function sendWelcome(chatId, firstName, startParam) {
  let message = `Привет, ${firstName || 'дорогой родитель'}! ✨\n\n` +
    `Добро пожаловать в **«Моя сказка»** — уютное приложение для создания персональных терапевтических сказок на ночь для детей 2–6 лет.\n\n`;

  if (startParam && startParam.startsWith('ref_')) {
    message += `🎁 **Вы перешли по приглашению друга!**\nВаша первая иллюстрированная история уже ждёт вас.\n\n`;
  }

  message += `🌟 **Что внутри приложения:**\n` +
    `• Первая персональная история — бесплатно!\n` +
    `• Ребёнок в главной роли сказки\n` +
    `• 4 сцены с красивыми иллюстрациями\n` +
    `• Вопросы для тёплой беседы перед сном\n` +
    `• Без подписки и скрытых платежей\n\n` +
    `Нажмите кнопку ниже, чтобы начать волшебное приключение! 👇`;

  const keyboard = {
    inline_keyboard: [
      [
        {
          text: '✨ Открыть «Моя сказка»',
          web_app: { url: WEB_APP_URL },
        },
      ],
      [
        {
          text: '💬 Поддержка',
          url: 'https://t.me/x9x9x9www',
        },
      ],
    ],
  };

  await callTelegram('sendMessage', {
    chat_id: chatId,
    text: message,
    parse_mode: 'Markdown',
    reply_markup: keyboard,
  });
}

async function startPolling() {
  console.log(`[Bot] Бот «Моя сказка» успешно запущен!`);
  console.log(`[Bot] Mini App URL: ${WEB_APP_URL}`);

  // Настройка кнопки меню чата
  await callTelegram('setChatMenuButton', {
    menu_button: {
      type: 'web_app',
      text: 'Моя сказка ✨',
      web_app: { url: WEB_APP_URL },
    },
  });

  let offset = 0;

  while (true) {
    try {
      const updates = await callTelegram('getUpdates', {
        offset,
        timeout: 30,
        allowed_updates: ['message', 'callback_query'],
      });

      if (updates && updates.ok && Array.isArray(updates.result)) {
        for (const update of updates.result) {
          offset = update.update_id + 1;

          if (update.message && update.message.text) {
            const chatId = update.message.chat.id;
            const text = update.message.text;
            const firstName = update.message.from?.first_name || '';

            console.log(`[Bot] Получено сообщение от ${firstName} (${chatId}): ${text}`);

            if (text.startsWith('/start')) {
              const parts = text.split(' ');
              const startParam = parts.length > 1 ? parts[1] : null;
              await sendWelcome(chatId, firstName, startParam);
            } else if (text === '/app') {
              await callTelegram('sendMessage', {
                chat_id: chatId,
                text: 'Нажмите кнопку ниже, чтобы открыть приложение:',
                reply_markup: {
                  inline_keyboard: [
                    [{ text: '✨ Открыть сказки', web_app: { url: WEB_APP_URL } }],
                  ],
                },
              });
            } else if (text === '/help') {
              await callTelegram('sendMessage', {
                chat_id: chatId,
                text: '«Моя сказка» помогает родителям создавать добрые персонализированные истории для детей 2–6 лет.\n\nПросто нажмите кнопку «Моя сказка ✨» внизу экрана!',
              });
            } else {
              // На любой текст предлагаем открыть Mini App
              await sendWelcome(chatId, firstName, null);
            }
          }
        }
      }
    } catch (err) {
      console.error('[Bot Polling Error]:', err.message);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

startPolling();
