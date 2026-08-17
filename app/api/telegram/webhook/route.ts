import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { TelegramService } from "@/lib/services/telegram-service";
import { WordFormSchema } from "@/lib/schemas";
import { WORD_STATUS } from "@/lib/constants";
import { capitalize } from "@/lib/utils";
import { getSession, setSession, resetToAwaitingWord } from "@/lib/telegram/session";

type AdminClient = ReturnType<typeof createAdminClient>;

const ASK_WORD_TEXT = "✏️ Введіть слово, яке хочете додати:";

const CONFIRM_KEYBOARD = {
  inline_keyboard: [
    [
      { text: "💾 Зберегти", callback_data: "add:confirm" },
      { text: "❌ Скасувати", callback_data: "add:cancel" },
    ],
  ],
};

export async function POST(request: Request) {
  const secret = request.headers.get("x-telegram-bot-api-secret-token");
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = await request.json();
  const supabase = createAdminClient();

  if (update.callback_query) {
    await handleCallbackQuery(supabase, update.callback_query);
    return NextResponse.json({ ok: true });
  }

  const message = update.message;
  const chatId: number | undefined = message?.chat?.id;
  const text: string | undefined = message?.text;

  if (!chatId || !text) {
    return NextResponse.json({ ok: true });
  }

  if (text.startsWith("/start")) {
    await handleStart(supabase, chatId, text);
    return NextResponse.json({ ok: true });
  }

  const { data: link } = await supabase
    .from("telegram_links")
    .select("user_id")
    .eq("telegram_chat_id", chatId)
    .maybeSingle();

  if (!link) {
    await TelegramService.sendMessage(
      chatId,
      `Спочатку прив'яжіть акаунт на сайті: ${process.env.NEXT_PUBLIC_SITE_URL}/telegram`
    );
    return NextResponse.json({ ok: true });
  }

  await handleMessage(chatId, text);
  return NextResponse.json({ ok: true });
}

async function handleStart(supabase: AdminClient, chatId: number, text: string) {
  const code = text.split(" ")[1]?.trim();
  if (!code) {
    await TelegramService.sendMessage(chatId, "Перейдіть за посиланням на сайті, щоб прив'язати акаунт.");
    return;
  }

  const { data: linkCode } = await supabase
    .from("telegram_link_codes")
    .select("user_id, expires_at")
    .eq("code", code)
    .maybeSingle();

  if (!linkCode || new Date(linkCode.expires_at) < new Date()) {
    await TelegramService.sendMessage(chatId, "Код прив'язки недійсний або застарів. Отримайте нове посилання на сайті.");
    return;
  }

  const { error: upsertError } = await supabase
    .from("telegram_links")
    .upsert({ user_id: linkCode.user_id, telegram_chat_id: chatId }, { onConflict: "user_id" });

  if (upsertError) {
    console.error("Telegram webhook: failed to link account", upsertError);
    await TelegramService.sendMessage(chatId, "Не вдалося прив'язати акаунт. Спробуйте ще раз пізніше.");
    return;
  }

  await supabase.from("telegram_link_codes").delete().eq("code", code);
  await resetToAwaitingWord(chatId);

  await TelegramService.sendMessage(
    chatId,
    `✅ Акаунт прив'язано!\n\n📖 <b>WordTrainer</b>\n\n${ASK_WORD_TEXT}`
  );
}

async function handleMessage(chatId: number, text: string) {
  const session = await getSession(chatId);

  if (session.state === "awaiting_translation") {
    const translation = capitalize(text);

    if (!translation) {
      await TelegramService.sendMessage(chatId, "⚠️ Введіть переклад текстом:");
      return;
    }

    await setSession(chatId, { state: "awaiting_confirm", pendingTranslation: translation });
    await TelegramService.sendMessage(
      chatId,
      `📖 <b>${session.pendingWord}</b> — <b>${translation}</b>\n\nЗберегти?`,
      CONFIRM_KEYBOARD
    );
    return;
  }

  if (session.state === "awaiting_confirm") {
    await TelegramService.sendMessage(chatId, "Скористайтеся кнопками вище 👆");
    return;
  }

  // awaiting_word (also the default/fallback state)
  const word = capitalize(text).replace(/’/g, "'");
  const wordValidation = WordFormSchema.safeParse({ word });

  if (!wordValidation.success) {
    await TelegramService.sendMessage(
      chatId,
      `⚠️ ${wordValidation.error.issues[0].message}\n\n${ASK_WORD_TEXT}`
    );
    return;
  }

  await setSession(chatId, { state: "awaiting_translation", pendingWord: word });
  await TelegramService.sendMessage(
    chatId,
    `✏️ Слово: <b>${word}</b>\n\nТепер введіть переклад українською:`
  );
}

async function handleCallbackQuery(
  supabase: AdminClient,
  callbackQuery: { id: string; data?: string; message?: { chat?: { id?: number } } }
) {
  await TelegramService.answerCallbackQuery(callbackQuery.id);

  const chatId = callbackQuery.message?.chat?.id;
  const data = callbackQuery.data;

  if (!chatId || !data) return;

  const { data: link } = await supabase
    .from("telegram_links")
    .select("user_id")
    .eq("telegram_chat_id", chatId)
    .maybeSingle();

  if (!link) return;

  if (data === "add:cancel") {
    await resetToAwaitingWord(chatId);
    await TelegramService.sendMessage(chatId, `❌ Скасовано.\n\n${ASK_WORD_TEXT}`);
    return;
  }

  if (data !== "add:confirm") return;

  const session = await getSession(chatId);
  const { pendingWord: word, pendingTranslation: translation } = session;

  if (!word || !translation) {
    await resetToAwaitingWord(chatId);
    await TelegramService.sendMessage(chatId, `⚠️ Сесію збереження втрачено.\n\n${ASK_WORD_TEXT}`);
    return;
  }

  const { data: existing } = await supabase
    .from("words")
    .select("id")
    .eq("user_id", link.user_id)
    .ilike("word", word)
    .maybeSingle();

  if (existing) {
    await resetToAwaitingWord(chatId);
    await TelegramService.sendMessage(
      chatId,
      `⚠️ Слово «<b>${word}</b>» вже є у вашому словнику.\n\n${ASK_WORD_TEXT}`
    );
    return;
  }

  const { error: insertError } = await supabase.from("words").insert({
    user_id: link.user_id,
    word,
    translation,
    examples: [],
    status: WORD_STATUS.NEW,
  });

  if (insertError) {
    console.error("Telegram webhook: failed to insert word", insertError);
    await resetToAwaitingWord(chatId);
    await TelegramService.sendMessage(chatId, `⚠️ Помилка збереження. Спробуйте ще раз.\n\n${ASK_WORD_TEXT}`);
    return;
  }

  await resetToAwaitingWord(chatId);
  await TelegramService.sendMessage(chatId, `✅ Додано: <b>${word}</b> — ${translation}\n\n${ASK_WORD_TEXT}`);
}
