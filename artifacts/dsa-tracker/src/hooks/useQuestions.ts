import { useState, useEffect, useCallback } from "react";
import { Question } from "@/types/question";
import { addDays, format, isBefore, isToday, parseISO, startOfDay } from "date-fns";

const STORAGE_KEY = "dsa-questions";
const LOG_KEY = "dsa-revision-log";

function todayStr() {
  return format(new Date(), "yyyy-MM-dd");
}

function dateToStr(iso: string) {
  try {
    return format(parseISO(iso), "yyyy-MM-dd");
  } catch {
    return format(new Date(), "yyyy-MM-dd");
  }
}

export function getNextRevisionDate(lastRevised: string, confidenceLevel: number): Date {
  const baseDate = startOfDay(parseISO(lastRevised));
  switch (confidenceLevel) {
    case 1: return addDays(baseDate, 2);
    case 2: return addDays(baseDate, 3);
    case 3: return addDays(baseDate, 5);
    case 4: return addDays(baseDate, 7);
    case 5: return addDays(baseDate, 10);
    default: return addDays(baseDate, 1);
  }
}

export function isDueForRevision(question: Question): boolean {
  const nextDate = getNextRevisionDate(question.lastRevised, question.confidenceLevel);
  const today = startOfDay(new Date());
  return isBefore(nextDate, today) || isToday(nextDate);
}

export function useQuestions() {
  const [questions, setQuestions] = useState<Question[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to parse stored questions", e);
      return [];
    }
  });

  const [revisionLog, setRevisionLog] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(LOG_KEY);
      if (stored) return JSON.parse(stored);
      // Seed from existing questions' lastRevised dates
      const qs: Question[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return qs.map((q) => dateToStr(q.lastRevised));
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
  }, [questions]);

  useEffect(() => {
    localStorage.setItem(LOG_KEY, JSON.stringify(revisionLog));
  }, [revisionLog]);

  const appendLog = useCallback((dateStr: string) => {
    setRevisionLog((prev) => [...prev, dateStr]);
  }, []);

  const addQuestion = useCallback((q: Omit<Question, "id">) => {
    const newQuestion: Question = {
      ...q,
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
    };
    setQuestions((prev) => [...prev, newQuestion]);
    appendLog(dateToStr(q.lastRevised));
  }, [appendLog]);

  const updateQuestion = useCallback((id: string, updates: Partial<Omit<Question, "id">>) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...updates } : q))
    );
    if (updates.lastRevised) {
      appendLog(dateToStr(updates.lastRevised));
    }
  }, [appendLog]);

  const deleteQuestion = useCallback((id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }, []);

  const markRevised = useCallback((id: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id ? { ...q, lastRevised: new Date().toISOString() } : q
      )
    );
    appendLog(todayStr());
  }, [appendLog]);

  return {
    questions,
    revisionLog,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    markRevised,
  };
}
