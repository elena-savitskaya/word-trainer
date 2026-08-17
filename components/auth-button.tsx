import Link from "next/link";
import { Send } from "lucide-react";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

export async function AuthButton() {
  const supabase = await createClient();

  // You can also use getUser() which will be slower.
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
        <Button asChild variant="outline" className="w-full md:w-auto rounded-xl h-12 px-6 shadow-lg shadow-black/5 hover:shadow-black/10 transition-all active:scale-95 group">
          <Link href="/auth/login">Увійти</Link>
        </Button>
        <Button asChild variant="default" className="w-full md:w-auto rounded-xl h-12 px-6 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95 group">
          <Link href="/auth/sign-up">Зареєструватися</Link>
        </Button>
      </div>
    );
  }

  const name = user.user_metadata?.full_name || user.email;

  return (
    <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto px-4 py-3 md:p-0">
      <span className="text-sm font-bold md:font-medium whitespace-nowrap">Привіт, {name}!</span>
      <Button asChild variant="outline" className="w-full md:w-auto rounded-xl h-12 px-6 font-bold shadow-sm gap-2">
        <Link href="/telegram">
          <Send className="w-4 h-4" /> Telegram
        </Link>
      </Button>
      <LogoutButton />
    </div>
  );
}
