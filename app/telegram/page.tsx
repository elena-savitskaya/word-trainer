import { Suspense } from "react";
import { Loader } from "@/components/ui/loader";
import { TelegramLinkSection } from "./telegram-link-section";

export default function TelegramPage() {
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
      <Suspense fallback={<Loader />}>
        <TelegramLinkSection />
      </Suspense>
    </div>
  );
}
