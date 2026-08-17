import { createAdminClient } from "@/lib/supabase/admin";

export type TelegramSessionState = "awaiting_word" | "awaiting_translation" | "awaiting_confirm";

export interface TelegramSession {
  state: TelegramSessionState;
  pendingWord: string | null;
  pendingTranslation: string | null;
}

const DEFAULT_SESSION: TelegramSession = {
  state: "awaiting_word",
  pendingWord: null,
  pendingTranslation: null,
};

export async function getSession(chatId: number): Promise<TelegramSession> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("telegram_sessions")
    .select("state, pending_word, pending_translation")
    .eq("telegram_chat_id", chatId)
    .maybeSingle();

  if (!data) return DEFAULT_SESSION;

  return {
    state: data.state as TelegramSessionState,
    pendingWord: data.pending_word,
    pendingTranslation: data.pending_translation,
  };
}

export async function setSession(chatId: number, session: Partial<TelegramSession>): Promise<void> {
  const supabase = createAdminClient();

  await supabase.from("telegram_sessions").upsert({
    telegram_chat_id: chatId,
    ...(session.state !== undefined && { state: session.state }),
    ...(session.pendingWord !== undefined && { pending_word: session.pendingWord }),
    ...(session.pendingTranslation !== undefined && { pending_translation: session.pendingTranslation }),
    updated_at: new Date().toISOString(),
  });
}

export async function resetToAwaitingWord(chatId: number): Promise<void> {
  await setSession(chatId, {
    state: "awaiting_word",
    pendingWord: null,
    pendingTranslation: null,
  });
}
