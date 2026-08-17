import { redirect } from "next/navigation";
import { getRequiredServerUser } from "@/lib/utils/get-required-server-user";
import { TelegramLinkCard } from "./telegram-link-card";

export async function TelegramLinkSection() {
  const { user, supabase } = await getRequiredServerUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: link } = await supabase
    .from("telegram_links")
    .select("telegram_chat_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return <TelegramLinkCard isLinked={!!link} />;
}
