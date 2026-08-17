"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, Unlink } from "lucide-react";
import { generateTelegramLinkCodeAction, unlinkTelegramAction } from "@/app/actions/telegram";
import { toast } from "sonner";

export function TelegramLinkCard({ isLinked }: { isLinked: boolean }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Linking happens in the Telegram app, outside this tab — when the user
  // comes back, re-check the real status instead of showing a stale button.
  useEffect(() => {
    if (isLinked) return;

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isLinked, router]);

  function handleLink() {
    startTransition(async () => {
      const { deepLink, error } = await generateTelegramLinkCodeAction();
      if (error || !deepLink) {
        toast.error(error || "Не вдалося створити посилання");
        return;
      }
      window.open(deepLink, "_blank");
    });
  }

  function handleUnlink() {
    startTransition(async () => {
      const { error } = await unlinkTelegramAction();
      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Telegram відв'язано");
      router.refresh();
    });
  }

  if (isLinked) {
    return (
      <Card className="border-none shadow-xl ring-1 ring-foreground/5 rounded-3xl overflow-hidden bg-muted/30">
        <CardHeader>
          <CardDescription className="text-center font-medium">
            ✅ Ваш Telegram прив&apos;язано
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center">
            Бот сам запитає слово, потім переклад — і запропонує зберегти.
          </p>
        </CardContent>
        <CardFooter className="p-6 bg-muted/20 border-t border-foreground/5">
          <Button
            type="button"
            variant="outline"
            className="h-12 w-full font-bold gap-2 border-destructive/20 hover:border-destructive/50 hover:bg-destructive/5 text-destructive"
            onClick={handleUnlink}
            disabled={isPending}
          >
            <Unlink className="w-5 h-5" /> Відв&apos;язати Telegram
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-xl ring-1 ring-foreground/5 rounded-3xl overflow-hidden bg-muted/30">
      <CardHeader>
        <CardDescription className="text-center font-medium">
          Прив&apos;яжіть Telegram, щоб додавати слова прямо з чату — бот покроково запитає слово і переклад.
        </CardDescription>
      </CardHeader>
      <CardFooter className="p-6 bg-muted/20 border-t border-foreground/5">
        <Button
          type="button"
          className="h-12 w-full font-bold shadow-lg transition-all"
          onClick={handleLink}
          disabled={isPending}
        >
          <Send className="mr-2 h-5 w-5" /> Прив&apos;язати Telegram
        </Button>
      </CardFooter>
    </Card>
  );
}
