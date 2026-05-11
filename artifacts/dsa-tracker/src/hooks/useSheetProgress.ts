import { useState, useEffect, useCallback, useMemo } from "react";
import { Sheet, SheetQuestion } from "@/types/sheet";

function storageKey(sheetId: string) {
  return `dsa-sheet-progress-${sheetId}`;
}

export function useSheetProgress(sheetId: string) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(storageKey(sheetId));
      return stored ? new Set<string>(JSON.parse(stored)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  useEffect(() => {
    localStorage.setItem(storageKey(sheetId), JSON.stringify(Array.from(completedIds)));
  }, [sheetId, completedIds]);

  const markComplete = useCallback((questionId: string) => {
    setCompletedIds((prev) => new Set([...prev, questionId]));
  }, []);

  const markIncomplete = useCallback((questionId: string) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      next.delete(questionId);
      return next;
    });
  }, []);

  const toggleComplete = useCallback((questionId: string) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  }, []);

  const isComplete = useCallback(
    (questionId: string) => completedIds.has(questionId),
    [completedIds]
  );

  const clearProgress = useCallback(() => {
    setCompletedIds(new Set());
  }, []);

  return {
    completedIds,
    completedCount: completedIds.size,
    markComplete,
    markIncomplete,
    toggleComplete,
    isComplete,
    clearProgress,
  };
}

export function useAllSheetStats(sheets: Sheet[]) {
  return useMemo(() => {
    return sheets.map((sheet) => {
      try {
        const stored = localStorage.getItem(storageKey(sheet.id));
        const completed: string[] = stored ? JSON.parse(stored) : [];
        return {
          sheetId: sheet.id,
          completed: completed.length,
          total: sheet.questions.length,
          percent: sheet.questions.length > 0
            ? Math.round((completed.length / sheet.questions.length) * 100)
            : 0,
        };
      } catch {
        return { sheetId: sheet.id, completed: 0, total: sheet.questions.length, percent: 0 };
      }
    });
  }, [sheets]);
}
