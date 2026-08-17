import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { TelegramService } from "@/lib/services/telegram-service";
import { WordFormSchema } from "@/lib/schemas";
import { WORD_STATUS } from "@/lib/constants";
import { capitalize } from "@/lib/utils";

export async function POST(request: Request) {
  const secret = request.headers.get("x-telegram-bot-api-secret-token");
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = await request.json();
  const message = update.message;
  const chatId: number | undefined = message?.chat?.id;
  const text: string | undefined = message?.text;

  if (!chatId || !text) {
    return NextResponse.json({ ok: true });
  }

  const supabase = createAdminClient();

  if (text.startsWith("/start")) {
    const code = text.split(" ")[1]?.trim();
    if (!code) {
      await TelegramService.sendMessage(chatId, "Перейдіть за посиланням на сайті, щоб прив'язати акаунт.");
      return NextResponse.json({ ok: true });
    }

    const { data: linkCode } = await supabase
      .from("telegram_link_codes")
      .select("user_id, expires_at")
      .eq("code", code)
      .maybeSingle();

    if (!linkCode || new Date(linkCode.expires_at) < new Date()) {
      await TelegramService.sendMessage(chatId, "Код прив'язки недійсний або застарів. Отримайте нове посилання на сайті.");
      return NextResponse.json({ ok: true });
    }

    const { error: upsertError } = await supabase
      .from("telegram_links")
      .upsert({ user_id: linkCode.user_id, telegram_chat_id: chatId }, { onConflict: "user_id" });

    if (upsertError) {
      console.error("Telegram webhook: failed to link account", upsertError);
      await TelegramService.sendMessage(chatId, "Не вдалося прив'язати акаунт. Спробуйте ще раз пізніше.");
      return NextResponse.json({ ok: true });
    }

    await supabase.from("telegram_link_codes").delete().eq("code", code);

    await TelegramService.sendMessage(
      chatId,
      "✅ Акаунт прив'язано! Надсилайте слово і переклад двома рядками, наприклад:\nschool\nшкола"
    );
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

  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const [rawWord, rawTranslation] = lines;
  const word = capitalize(rawWord).replace(/’/g, "'");
  const translation = capitalize(rawTranslation);

  const wordValidation = WordFormSchema.safeParse({ word });
  if (!wordValidation.success || !translation) {
    await TelegramService.sendMessage(
      chatId,
      "Надішліть слово і переклад двома рядками, наприклад:\nschool\nшкола"
    );
    return NextResponse.json({ ok: true });
  }

  const { data: existing } = await supabase
    .from("words")
    .select("id")
    .eq("user_id", link.user_id)
    .ilike("word", word)
    .maybeSingle();

  if (existing) {
    await TelegramService.sendMessage(chatId, `Слово "${word}" вже є у вашому словнику.`);
    return NextResponse.json({ ok: true });
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
    await TelegramService.sendMessage(chatId, "Помилка збереження слова. Спробуйте ще раз.");
    return NextResponse.json({ ok: true });
  }

  await TelegramService.sendMessage(chatId, `✅ Додано: ${word} — ${translation}`);
  return NextResponse.json({ ok: true });
}
