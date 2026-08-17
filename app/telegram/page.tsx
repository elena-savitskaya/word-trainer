import { redirect } from "next/navigation";
import { getRequiredServerUser } from "@/lib/utils/get-required-server-user";
import { TelegramLinkCard } from "./telegram-link-card";

export default async function TelegramPage() {
  const { user, supabase } = await getRequiredServerUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: link } = await supabase
    .from("telegram_links")
    .select("telegram_chat_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-8 py-8 w-full px-4 sm:px-5">
      <div className="flex flex-col gap-2 items-center justify-center text-center">
        <h3 className="text-4xl font-extrabold tracking-tight">
          Telegram
        </h3>
        <p className="text-lg text-muted-foreground max-w-lg">
          Додавайте слова прямо з Telegram, без відкриття сайту.
        </p>
      </div>
      <TelegramLinkCard isLinked={!!link} />
    </div>
  );
}
