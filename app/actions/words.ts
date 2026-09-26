"use server";

import { revalidatePath } from "next/cache";
import { WordFormSchema, TranslationResultSchema } from "@/lib/schemas";
import { redirect } from "next/navigation";
import { AIService } from "@/lib/services/ai-service";
import { ActionState } from "@/types";
import { getRequiredServerUser } from "@/lib/utils/get-required-server-user";
import { WORD_STATUS } from "@/lib/constants";
import { capitalize } from "@/lib/utils";

export async function translateWordAction(word: string): Promise<ActionState> {
  const { data, error } = await AIService.translateWord(word);

  if (error) {
    return { error };
  }

  return { success: true, data };
}

export async function addWordAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const word = capitalize(formData.get("word") as string).replace(/’/g, "'");
  const translation = capitalize(formData.get("translation") as string);
  const examplesJson = formData.get("examples") as string;

  // Validate input
  const wordValidation = WordFormSchema.safeParse({ word });
  if (!wordValidation.success) {
    return { error: wordValidation.error.issues[0].message };
  }

  let examples;
  try {
    examples = JSON.parse(examplesJson);
    const translationValidation = TranslationResultSchema.pick({ translation: true, examples: true }).safeParse({
      translation,
      examples,
    });
    if (!translationValidation.success) {
      return { error: "Некоректні дані перекладу" };
    }
  } catch {
    return { error: "Помилка обробки прикладів" };
  }

  const { user, supabase } = await getRequiredServerUser();

  if (!user) {
    return { error: "Необхідна авторизація" };
  }

  // Check for duplicate
  const { data: existing } = await supabase
    .from("words")
    .select("id")
    .eq("user_id", user.id)
    .ilike("word", word.trim())
    .maybeSingle();

  if (existing) {
    return { error: `Слово "${word}" вже є у вашому словнику.` };
  }

  const { error: dbError } = await supabase.from("words").insert({
    user_id: user.id,
    word,
    translation,
    examples,
    status: WORD_STATUS.NEW,
  });

  if (dbError) {
    console.error("DB Error:", dbError);
    return { error: "Помилка збереження в базу даних" };
  }

  revalidatePath("/words");
  redirect("/words");
}

export async function updateWordAction(id: string, updates: { translation?: string; examples?: unknown; status?: string }) {
  const { supabase } = await getRequiredServerUser();

  if (updates.translation) {
    updates.translation = capitalize(updates.translation);
  }

  const { error } = await supabase
    .from("words")
    .update(updates)
    .eq("id", id);

  if (error) {
    console.error("Error updating word:", error);
    return { error: error.message };
  }

  revalidatePath("/words");
  return { success: true };
}

export async function deleteWordAction(id: string) {
  const { supabase } = await getRequiredServerUser();

  const { error } = await supabase
    .from("words")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting word:", error);
    return { error: error.message };
  }

  revalidatePath("/words");
  return { success: true };
}

export async function getWordsForTraining(): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const { user, supabase } = await getRequiredServerUser();
    if (!user) return { success: false, error: "Необхідна авторизація" };

    // Fetch all words that are NEW or LEARNING
    const { data: words, error } = await supabase
      .from("words")
      .select("*")
      .eq("user_id", user.id)
      .in("status", [WORD_STATUS.NEW, WORD_STATUS.LEARNING]);

    if (error) throw error;

    if (!words || words.length === 0) {
      return { success: true, data: [] };
    }

    // Shuffle all qualifying words and take 6
    const shuffled = words.sort(() => 0.5 - Math.random()).slice(0, 6);

    return { success: true, data: shuffled };
  } catch (error: any) {
    console.error("Error fetching training words:", error);
    return { success: false, error: error.message };
  }
}

export async function updateWordStatus(id: string, status: string) {
  const { supabase } = await getRequiredServerUser();

  const { error } = await supabase
    .from("words")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error("Error updating word status:", error);
    return { error: error.message };
  }

  revalidatePath("/words");
  revalidatePath("/");
  return { success: true };
}

export async function incrementWordsProgress(ids: string[]) {
  const { supabase } = await getRequiredServerUser();

  // Fetch current progress to decide new status
  const { data: words, error: fetchError } = await supabase
    .from("words")
    .select("id, progress, status")
    .in("id", ids);

  if (fetchError) {
    console.error("Error fetching words for progress increment:", fetchError);
    return { error: fetchError.message };
  }

  const updates = words.map((w) => {
    const newProgress = (w.progress || 0) + 1;
    let newStatus = w.status;

    if (newProgress >= 5) {
      newStatus = WORD_STATUS.LEARNED;
    } else if (newProgress > 0) {
      newStatus = WORD_STATUS.LEARNING;
    }

    return {
      id: w.id,
      progress: newProgress,
      status: newStatus,
    };
  });

  // Use a recursive or bulk update. Unfortunately Supabase update only works with a single filter unless it's a batch update with an array of objects which it isn't.
  // Actually, we can use an RPC or just run them in parallel if the list is small (it's 6 words).
  const updatePromises = updates.map((u) =>
    supabase
      .from("words")
      .update({ progress: u.progress, status: u.status })
      .eq("id", u.id)
  );

  const results = await Promise.all(updatePromises);
  const error = results.find((r) => r.error)?.error;

  if (error) {
    console.error("Error incrementing words progress:", error);
    return { error: error.message };
  }

  revalidatePath("/words");
  revalidatePath("/");
  return { success: true };
}

export async function repeatWordAction(id: string) {
  const { supabase } = await getRequiredServerUser();

  const { error } = await supabase
    .from("words")
    .update({ 
      status: WORD_STATUS.LEARNING,
      progress: 0 
    })
    .eq("id", id);

  if (error) {
    console.error("Error resetting word for repetition:", error);
    return { error: error.message };
  }

  revalidatePath("/words");
  revalidatePath("/");
  return { success: true };
}
