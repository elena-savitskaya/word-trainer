export class TelegramService {
  static async sendMessage(chatId: number, text: string): Promise<void> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.error("TelegramService: TELEGRAM_BOT_TOKEN is not set");
      return;
    }

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });

    if (!response.ok) {
      console.error("TelegramService: sendMessage failed", await response.text());
    }
  }
}
