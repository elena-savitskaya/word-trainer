"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { getRequiredServerUser } from "@/lib/utils/get-required-server-user";

const LINK_CODE_TTL_MS = 15 * 60 * 1000;

export async function generateTelegramLinkCodeAction(): Promise<{ deepLink?: string; error?: string }> {
  const { user, supabase } = await getRequiredServerUser();

  if (!user) {
    return { error: "Необхідна авторизація" };
  }

  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
  if (!botUsername) {
    return { error: "Telegram-бот ще не налаштований" };
  }

  const code = randomUUID().slice(0, 8);
  const expiresAt = new Date(Date.now() + LINK_CODE_TTL_MS).toISOString();

  const { error } = await supabase.from("telegram_link_codes").insert({
    code,
    user_id: user.id,
    expires_at: expiresAt,
  });

  if (error) {
    console.error("Error creating telegram link code:", error);
    return { error: "Не вдалося створити код прив'язки" };
  }

  return { deepLink: `https://t.me/${botUsername}?start=${code}` };
}

export async function unlinkTelegramAction(): Promise<{ success?: boolean; error?: string }> {
  const { user, supabase } = await getRequiredServerUser();

  if (!user) {
    return { error: "Необхідна авторизація" };
  }

  const { error } = await supabase.from("telegram_links").delete().eq("user_id", user.id);

  if (error) {
    console.error("Error unlinking telegram:", error);
    return { error: "Не вдалося відв'язати Telegram" };
  }

  revalidatePath("/telegram");
  return { success: true };
}
