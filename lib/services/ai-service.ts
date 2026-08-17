import { createGroq } from "@ai-sdk/groq";
import { APICallError, Output, generateText } from "ai";
import { TranslationResultSchema } from "@/lib/schemas";
import { z } from "zod";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

export type TranslationResponse = z.infer<typeof TranslationResultSchema>;

export class AIService {
  static async translateWord(word: string): Promise<{ data?: TranslationResponse; error?: string }> {
    if (!word || typeof word !== "string") {
      return { error: "Word is required" };
    }

    const systemPrompt = `
    Ви - професійний англійський редактор та лінгвіст з глибоким знанням оксфордських та кембриджських словників.
    Ваше завдання - перекласти англійське слово або фразу на українську та ПЕРЕВІРИТИ ПРАВОПИС.

    Ваші суворі правила:
    1. Надайте точний, контекстуальний переклад.
    2. ПЕРЕВІРКА ПРАВОПИСУ: Ретельно проаналізуйте кожне слово. Якщо є хоча б одна друкарська помилка (наприклад, "gou" замість "go", "scholl" замість "school", "flowwww" замість "flow"), ви ПОВИННІ вказати виправлений варіант у полі "correctedWord". Будьте суворими до помилок.
    3. ПРАВИЛО ФРАЗ: Якщо це фраза (наприклад, "go to school"), зберігайте її структуру, але виправляйте помилки всередині неї.
    4. Надайте 3 якісних приклади використання з перекладом.
    5. МОВНЕ ОБМЕЖЕННЯ: Якщо введено кирилицю, поверніть: "Будь ласка, вводьте слова лише англійською мовою." у "translation" та null у "correctedWord".
    6. НЕРОЗПІЗНАНЕ: Якщо вхідні дані не мають сенсу в англійській мові, поверніть "не розпізнано" у "translation" та null у "correctedWord".

    Поверніть відповідь ТІЛЬКИ у форматі JSON:
    {
      "translation": "переклад",
      "correctedWord": "виправлений варіант або null",
      "examples": [
        { "en": "Example", "ua": "Переклад прикладу" }
      ]
    }
    `;

    try {
      const { output: object } = await generateText({
        model: groq("openai/gpt-oss-20b"),
        output: Output.object({ schema: TranslationResultSchema }),
        system: systemPrompt,
        prompt: `Input: "${word.trim()}"`,
      });

      if (object.error_message) {
        return { error: object.error_message };
      }

      return { data: object };
    } catch (err: unknown) {
      console.error("AIService Error:", err);
      if (err instanceof z.ZodError) {
        return { error: "ШІ повернув некоректні дані. Спробуйте інше слово." };
      }
      if (APICallError.isInstance(err)) {
        return { error: "Сервіс перекладу тимчасово недоступний (помилка API). Спробуйте пізніше." };
      }
      return { error: "Помилка роботи штучного інтелекту. Спробуйте ще раз пізніше." };
    }
  }
}
