interface InlineKeyboardButton {
  text: string;
  callback_data: string;
}

type ReplyMarkup = {
  inline_keyboard: InlineKeyboardButton[][];
};

export class TelegramService {
  static async sendMessage(chatId: number, text: string, replyMarkup?: ReplyMarkup): Promise<void> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.error("TelegramService: TELEGRAM_BOT_TOKEN is not set");
      return;
    }

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        ...(replyMarkup && { reply_markup: replyMarkup }),
      }),
    });

    if (!response.ok) {
      console.error("TelegramService: sendMessage failed", await response.text());
    }
  }

  static async answerCallbackQuery(callbackQueryId: string): Promise<void> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.error("TelegramService: TELEGRAM_BOT_TOKEN is not set");
      return;
    }

    const response = await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id: callbackQueryId }),
    });

    if (!response.ok) {
      console.error("TelegramService: answerCallbackQuery failed", await response.text());
    }
  }
}
