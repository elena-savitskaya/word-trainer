import { z } from "zod";

export const ExampleSchema = z.object({
  en: z.string().min(1, "English sentence is required"),
  ua: z.string().min(1, "Ukrainian translation is required"),
});

export const TranslationResultSchema = z.object({
  translation: z.string().min(1, "Translation is required"),
  examples: z.array(ExampleSchema),
  correctedWord: z.string().nullable(),
  error_message: z.string().nullable(),
});

export const WordFormSchema = z.object({
  word: z
    .string()
    .min(1, "Слово обов'язкове")
    .max(100, "Слово занадто довге")
    .regex(/^[a-zA-Z\s'’\-\/?]+$/, "Дозволені лише латинські літери"),
});

export type TranslationResult = z.infer<typeof TranslationResultSchema>;
export type WordFormValues = z.infer<typeof WordFormSchema>;
