from __future__ import annotations

import asyncio
import logging
import os
from pathlib import Path
from typing import Any, Callable, Dict, Optional

from aiogram import Bot, Dispatcher, F, Router
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.exceptions import TelegramBadRequest
from aiogram.filters import CommandStart
from aiogram.types import (
    CallbackQuery,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    LinkPreviewOptions,
    Message,
    TelegramObject,
    WebAppInfo,
)
from aiogram.dispatcher.middlewares.base import BaseMiddleware

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────
# 1. ЗАГРУЗКА .ENV И КОНСТАНТЫ
# ──────────────────────────────────────────────────────────
ROOT_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = ROOT_DIR / ".env"

def load_env_file(path: Path) -> None:
    if not path.exists():
        return
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                key, val = line.split("=", 1)
                key = key.strip()
                val = val.strip().strip("'\"")
                if key and key not in os.environ:
                    os.environ[key] = val

load_env_file(ENV_PATH)

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "8307642118:AAGqGhR80eoxQ4COW9VBCntGmjBhFzSsnFA")
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://x9x9x9www.github.io/moya-skazka/?v=2.6")
ARTICLE_PREVIEW_URL = "https://x9x9x9www.github.io/moya-skazka/article.html?v=1"

# Telegram Premium Custom Emoji ID (внутри тега обязательно указан fallback-символ)
EMOJI = {
    "MAGIC": '<tg-emoji emoji-id="5465465412345678902">✨</tg-emoji>',
    "BOOK": '<tg-emoji emoji-id="5465465412345678901">📖</tg-emoji>',
    "STAR": '<tg-emoji emoji-id="5424987654321098765">⭐️</tg-emoji>',
    "STATUS": '<tg-emoji emoji-id="5370894023471049281">⚡️</tg-emoji>',
    "FIRE": '<tg-emoji emoji-id="5368324170671202286">🔥</tg-emoji>',
    "HEART": '<tg-emoji emoji-id="5368324170671202287">💖</tg-emoji>',
    "GIFT": '<tg-emoji emoji-id="5465465412345678903">🎁</tg-emoji>',
}

router = Router()


# ──────────────────────────────────────────────────────────
# 2. LIVING MESSAGE SERVICE (Single Living Message Architecture)
# ──────────────────────────────────────────────────────────
class LivingMessageManager:
    """
    Реализует архитектуру 'Single Living Message' (Единое живое сообщение):
    В чате всегда находится ровно одно актуальное сообщение-дашборд.
    При любом переходе или обновлении старое сообщение удаляется, а новое отправляется
    в формате единого пузыря «Статьи» с анимированным медиа-баннером сверху.
    """
    def __init__(self):
        self._living_messages: Dict[int, int] = {}

    async def render_screen(
        self,
        bot: Bot,
        chat_id: int,
        text: str,
        reply_markup: Optional[InlineKeyboardMarkup] = None,
        article_url: str = ARTICLE_PREVIEW_URL,
    ) -> Message:
        # 1. Скрытая ссылка с нулевым пробелом (&#8203;) для чистого LinkPreview без текста ссылки
        hidden_link = f'<a href="{article_url}">&#8203;</a>'
        full_text = f"{hidden_link}{text}"

        # 2. Настройка крупного медиа-баннера НАД текстом сообщения
        preview_opts = LinkPreviewOptions(
            url=article_url,
            is_disabled=False,
            prefer_large_media=True,
            show_above_text=True,
        )

        # 3. Удаление старого сервисного сообщения пользователя
        old_msg_id = self._living_messages.get(chat_id)
        if old_msg_id:
            try:
                await bot.delete_message(chat_id=chat_id, message_id=old_msg_id)
            except TelegramBadRequest:
                pass
            except Exception as e:
                logger.debug("Старое сервисное сообщение не удалено: %s", e)

        # 4. Отправка нового экрана в формате единого пузыря статьи
        new_msg = await bot.send_message(
            chat_id=chat_id,
            text=full_text,
            reply_markup=reply_markup,
            parse_mode=ParseMode.HTML,
            link_preview_options=preview_opts,
        )

        # 5. Сохранение ID последнего актуального сообщения
        self._living_messages[chat_id] = new_msg.message_id
        return new_msg


living_manager = LivingMessageManager()


# ──────────────────────────────────────────────────────────
# 3. AUTO-CLEAN MIDDLEWARE (Удаление спама пользователя)
# ──────────────────────────────────────────────────────────
class AutoCleanIncomingMiddleware(BaseMiddleware):
    """
    Автоматически удаляет любые входящие пользовательские сообщения (текст, стикеры, медиа)
    сразу после их обработки, сохраняя чат кристально чистым.
    Исключение: команда /start (не удаляется, чтобы не сбрасывать сессию клиента Telegram).
    """
    async def __call__(
        self,
        handler: Callable[[TelegramObject, Dict[str, Any]], Any],
        event: TelegramObject,
        data: Dict[str, Any],
    ) -> Any:
        if isinstance(event, Message):
            raw_text = (event.text or "").strip().lower()
            # НИКОГДА не удаляем /start! Удаление /start возвращает кнопку «Начать» вместо клавиатуры
            if not raw_text.startswith("/start"):
                try:
                    await event.delete()
                except TelegramBadRequest:
                    pass
                except Exception as e:
                    logger.debug("Не удалось удалить пользовательское сообщение: %s", e)
        return await handler(event, data)


# ──────────────────────────────────────────────────────────
# 4. ТЕКСТЫ ЭКРАНОВ И ТИПОГРАФИКА
# ──────────────────────────────────────────────────────────
def get_main_screen_text(user_name: str) -> str:
    return (
        f"<u><i><b>МОЯ СКАЗКА // ПЕРСОНАЛЬНЫЕ ИИ-КНИГИ</b></i></u>\n"
        f"<b>••• ━━━━━━━━━━━━━━━━━━━━ •••</b>\n\n"
        f"Привет, <b>{user_name}</b>! {EMOJI['MAGIC']}\n\n"
        f"Добро пожаловать в волшебную мастерскую персонализированных терапевтических сказок на ночь для детей 2–6 лет.\n\n"
        f"{EMOJI['STATUS']} <b>Статус ИИ-мастерской:</b> <code>ONLINE (Готова к созданию)</code>\n"
        f"{EMOJI['BOOK']} <b>Сюжет:</b> <code>Story DNA Engine (gpt-6-luna)</code>\n"
        f"{EMOJI['STAR']} <b>Иллюстрации:</b> <code>3D Pixar Portals (nano-banana-2)</code>\n"
        f"{EMOJI['FIRE']} <b>Спецэффект:</b> 3D-аватарка ребёнка по фото + выбор наряда\n\n"
        f"{EMOJI['GIFT']} <i>Первая персональная сказка для вашего малыша — в подарок!</i>"
    )

def get_about_screen_text() -> str:
    return (
        f"<u><i><b>О СКАЗКАХ И ТЕРАПИИ // МОЯ СКАЗКА</b></i></u>\n"
        f"<b>••• ━━━━━━━━━━━━━━━━━━━━ •••</b>\n\n"
        f"{EMOJI['MAGIC']} <b>Как создаётся чудо:</b>\n"
        f"• Вы загружаете фото малыша — зрение ИИ считывает черты лица и цвет волос.\n"
        f"• Сервер создаёт 3D Pixar портрет-аватарку в сказочном наряде.\n"
        f"• Автор сочиняет историю под характер, возраст и любимые игрушки ребёнка.\n"
        f"• Художник рисует 4 сюжетные иллюстрации и обложку книги.\n\n"
        f"{EMOJI['HEART']} <b>Вопросы перед сном:</b> каждая сказка развивает эмпатию, смелость и доброту."
    )

def get_gift_screen_text() -> str:
    return (
        f"<u><i><b>ВАШ ПОДАРОК // ПЕРВАЯ СКАЗКА</b></i></u>\n"
        f"<b>••• ━━━━━━━━━━━━━━━━━━━━ •••</b>\n\n"
        f"{EMOJI['GIFT']} <b>Бесплатная первая книга активирована!</b>\n\n"
        f"Вам доступно:\n"
        f"• Генерация персональной иллюстрированной книги (4 сцены)\n"
        f"• Озвучка и вопросы для тёплой беседы перед сном\n"
        f"• Создание 3D-аватарки ребёнка по фото\n\n"
        f"<i>Нажмите кнопку ниже, чтобы запустить сказочный визард!</i>"
    )

def get_main_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="✨ Открыть «Моя сказка»",
                    web_app=WebAppInfo(url=WEBAPP_URL),
                ),
            ],
            [
                InlineKeyboardButton(text="📖 Как это работает", callback_data="screen_about"),
                InlineKeyboardButton(text="🎁 Мой подарок", callback_data="screen_gift"),
            ],
            [
                InlineKeyboardButton(text="🔄 Обновить статус", callback_data="screen_refresh"),
            ],
        ]
    )

def get_back_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="✨ Создать сказку сейчас",
                    web_app=WebAppInfo(url=WEBAPP_URL),
                ),
            ],
            [
                InlineKeyboardButton(text="◀️ Назад в меню", callback_data="screen_main"),
            ],
        ]
    )


# ──────────────────────────────────────────────────────────
# 5. ОБРАБОТЧИКИ НАВИГАЦИИ (CALLBACKS & COMMANDS)
# ──────────────────────────────────────────────────────────
@router.message(CommandStart())
async def handle_start(message: Message, bot: Bot):
    user_name = message.from_user.first_name if message.from_user else "Заботливый родитель"
    await living_manager.render_screen(
        bot=bot,
        chat_id=message.chat.id,
        text=get_main_screen_text(user_name),
        reply_markup=get_main_keyboard(),
    )

@router.callback_query(F.data == "screen_main")
async def handle_back_main(callback: CallbackQuery, bot: Bot):
    await callback.answer()
    user_name = callback.from_user.first_name or "Заботливый родитель"
    await living_manager.render_screen(
        bot=bot,
        chat_id=callback.message.chat.id,
        text=get_main_screen_text(user_name),
        reply_markup=get_main_keyboard(),
    )

@router.callback_query(F.data == "screen_about")
async def handle_about(callback: CallbackQuery, bot: Bot):
    await callback.answer()
    await living_manager.render_screen(
        bot=bot,
        chat_id=callback.message.chat.id,
        text=get_about_screen_text(),
        reply_markup=get_back_keyboard(),
    )

@router.callback_query(F.data == "screen_gift")
async def handle_gift(callback: CallbackQuery, bot: Bot):
    await callback.answer()
    await living_manager.render_screen(
        bot=bot,
        chat_id=callback.message.chat.id,
        text=get_gift_screen_text(),
        reply_markup=get_back_keyboard(),
    )

@router.callback_query(F.data == "screen_refresh")
async def handle_refresh(callback: CallbackQuery, bot: Bot):
    await callback.answer("Дашборд обновлен! ✨")
    user_name = callback.from_user.first_name or "Заботливый родитель"
    await living_manager.render_screen(
        bot=bot,
        chat_id=callback.message.chat.id,
        text=get_main_screen_text(user_name),
        reply_markup=get_main_keyboard(),
    )


# ──────────────────────────────────────────────────────────
# 6. СТАРТ БОТА И ОЧИСТКА МЕНЮ КОМАНД
# ──────────────────────────────────────────────────────────
async def start_bot():
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

    bot = Bot(
        token=BOT_TOKEN,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )
    dp = Dispatcher()

    # Регистрация middleware автоочистки пользовательских сообщений
    dp.message.middleware(AutoCleanIncomingMiddleware())
    dp.include_router(router)

    # Правило 3: Полная очистка слэш-команд в клиенте Telegram
    try:
        await bot.delete_my_commands()
        logger.info("[Bot] Меню слэш-команд успешно очищено (delete_my_commands)")
    except Exception as e:
        logger.warning(f"[Bot] Не удалось очистить команды: {e}")

    await bot.delete_webhook(drop_pending_updates=True)
    logger.info("[Bot] Запуск aiogram 3 бота 'Моя сказка' в режиме Single Living Message...")
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(start_bot())
