"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Word } from "@/types";

interface BrowseCardProps {
  word: Word;
}

export function BrowseCard({ word }: BrowseCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const getFontSize = (text: string) => {
    const len = text.length;
    if (len <= 12) return "text-2xl";
    if (len <= 25) return "text-xl";
    if (len <= 50) return "text-lg";
    return "text-base";
  };

  return (
    <div className="relative w-full h-[160px] perspective-1000">
      <motion.div
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 150, damping: 20 }}
        className="w-full h-full relative preserve-3d cursor-pointer rounded-2xl"
        onClick={() => setIsFlipped((prev) => !prev)}
      >
        <Card className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center rounded-2xl backface-hidden border-2 border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-none">
          <h3
            className={cn(
              "font-black text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight select-none text-balance",
              getFontSize(word.word)
            )}
          >
            {word.word}
          </h3>
        </Card>

        <Card
          className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center rounded-2xl backface-hidden border-2 border-zinc-300 dark:border-zinc-800 bg-zinc-200 dark:bg-zinc-900 overflow-hidden shadow-none"
          style={{ transform: "rotateY(180deg)" }}
        >
          <h3
            className={cn(
              "font-black text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight select-none text-balance",
              getFontSize(word.translation || "")
            )}
          >
            {word.translation}
          </h3>
        </Card>
      </motion.div>
    </div>
  );
}
