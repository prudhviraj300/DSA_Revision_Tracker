import { useState, useEffect, useCallback } from "react";
import { Question } from "@/types/question";
import { addDays, isBefore, isToday, parseISO, startOfDay } from "date-fns";

const STORAGE_KEY = "dsa-questions";

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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
  }, [questions]);

  const addQuestion = useCallback((q: Omit<Question, "id">) => {
    const newQuestion: Question = {
      ...q,
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
    };
    setQuestions((prev) => [...prev, newQuestion]);
  }, []);

  const updateQuestion = useCallback((id: string, updates: Partial<Omit<Question, "id">>) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...updates } : q))
    );
  }, []);

  const deleteQuestion = useCallback((id: string) => {
    setQuestions((prev) => prev.map(q => q.id === id ? { ...q, _deleted: true } : q).filter(q => q.id !== id));
  }, []);

  const markRevised = useCallback((id: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id ? { ...q, lastRevised: new Date().toISOString() } : q
      )
    );
  }, []);

  return {
    questions,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    markRevised,
  };
}
