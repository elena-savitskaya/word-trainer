"use client";

import { useState, useEffect, useMemo } from "react";
import { WordItem } from "./word-item";
import { BrowseCard } from "./browse-card";
import { WORD_STATUS } from "@/lib/constants";
import { WordsListHeader } from "./words-list-header";
import { WordsTabs } from "./words-tabs";
import { WordsEmptyState } from "./words-empty-state";
import { useSearchParams } from "next/navigation";

interface WordsListClientProps {
  initialWords: any[];
}

export function WordsListClient({ initialWords }: WordsListClientProps) {
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "cards">("list");
  const [isMounted, setIsMounted] = useState(false);

  const searchParams = useSearchParams();

  // Handle URL parameters and localStorage persistence
  useEffect(() => {
    // Tab persistence
    const urlTab = searchParams.get("tab");
    const validTabs = ["all", "processing", "learned"];
    
    if (urlTab && validTabs.includes(urlTab)) {
      setActiveTab(urlTab);
      localStorage.setItem("words_active_tab", urlTab);
    } else {
      const savedTab = localStorage.getItem("words_active_tab");
      if (savedTab) {
        setActiveTab(savedTab);
      }
    }

    // Sort persistence
    const savedSort = localStorage.getItem("words_sort_by");
    const validSorts = ["newest", "oldest", "az", "za"];

    if (savedSort && validSorts.includes(savedSort)) {
      setSortBy(savedSort);
    }

    // View mode persistence
    const savedViewMode = localStorage.getItem("words_view_mode");
    if (savedViewMode === "list" || savedViewMode === "cards") {
      setViewMode(savedViewMode);
    }

    setIsMounted(true);
  }, [searchParams]);

  // Handlers for state changes with persistence
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    localStorage.setItem("words_active_tab", value);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    localStorage.setItem("words_sort_by", value);
  };

  const handleViewModeChange = (value: "list" | "cards") => {
    setViewMode(value);
    localStorage.setItem("words_view_mode", value);
  };

  // Memoized counts for performance
  const counts = useMemo(() => ({
    all: initialWords.length,
    processing: initialWords.filter(w => w.status !== WORD_STATUS.LEARNED).length,
    learned: initialWords.filter(w => w.status === WORD_STATUS.LEARNED).length,
  }), [initialWords]);

  // Memoized filtering and sorting
  const processedWords = useMemo(() => {
    let result = initialWords.filter((word) => {
      // Filter by tab
      if (activeTab === "processing" && word.status === WORD_STATUS.LEARNED) {
        return false;
      }
      if (activeTab === "learned" && word.status !== WORD_STATUS.LEARNED) {
        return false;
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesWord = word.word.toLowerCase().includes(query);
        const matchesTranslation = word.translation.toLowerCase().includes(query);
        return matchesWord || matchesTranslation;
      }

      return true;
    });

    // Apply sorting
    return [...result].sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === "az") {
        return a.word.localeCompare(b.word);
      }
      if (sortBy === "za") {
        return b.word.localeCompare(a.word);
      }
      return 0;
    });
  }, [initialWords, activeTab, sortBy, searchQuery]);

  if (!isMounted) {
    return <div className="h-[200px]" />; // Placeholder to avoid layout shift
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        <WordsListHeader
          count={processedWords.length}
          activeTab={activeTab}
          sortBy={sortBy}
          onSortChange={handleSortChange}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
        />
        
        <WordsTabs 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
        />
      </div>

      <div className="space-y-3">
        {processedWords.length === 0 ? (
          <WordsEmptyState activeTab={activeTab} />
        ) : viewMode === "cards" ? (
          <div className="grid grid-cols-1 min-[520px]:grid-cols-2 sm:grid-cols-3 gap-3">
            {processedWords.map((item) => (
              <BrowseCard key={item.id} word={item} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {processedWords.map((item) => (
              <WordItem
                key={item.id}
                word={item}
                showRepeatButton={activeTab === "learned"}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
