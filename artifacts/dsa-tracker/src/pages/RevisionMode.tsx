import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Play,
  Pause,
  SkipForward,
  CheckCircle2,
  XCircle,
  Timer,
  RefreshCw,
  ExternalLink,
  Target,
  ChevronLeft,
  ChevronRight,
  Flame,
} from "lucide-react";
import { useQuestions } from "@/hooks/useQuestions";
import { Question, TAGS } from "@/types/question";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type SessionState = "setup" | "active" | "done";

interface SessionResult {
  question: Question;
  status: "done" | "skipped";
}

const TIMER_OPTIONS = [
  { label: "No Timer", value: 0 },
  { label: "10 min", value: 600 },
  { label: "15 min", value: 900 },
  { label: "20 min", value: 1200 },
  { label: "30 min", value: 1800 },
  { label: "45 min", value: 2700 },
  { label: "60 min", value: 3600 },
];

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function TimerRing({ seconds, total }: { seconds: number; total: number }) {
  const percent = total > 0 ? (seconds / total) * 100 : 100;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const dash = (percent / 100) * circumference;
  const isLow = percent < 20;

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/30" />
        <circle
          cx="50" cy="50" r={radius} fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className={isLow ? "text-red-500" : "text-primary"}
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s linear" }}
        />
      </svg>
      <span className={cn("text-lg font-mono font-bold", isLow && "text-red-500")}>
        {formatTime(seconds)}
      </span>
    </div>
  );
}

export function RevisionMode() {
  const { questions, markRevised } = useQuestions();

  const [sessionState, setSessionState] = useState<SessionState>("setup");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerTotal, setTimerTotal] = useState(0);

  const [sessionQueue, setSessionQueue] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<SessionResult[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const allTopics = useMemo(() => {
    const fromQuestions = Array.from(new Set(questions.flatMap((q) => q.tags))).sort();
    return fromQuestions.length > 0 ? fromQuestions : TAGS;
  }, [questions]);

  const eligibleQuestions = useMemo(() => {
    if (selectedTopic === "all") return questions;
    return questions.filter((q) => q.tags.includes(selectedTopic));
  }, [questions, selectedTopic]);

  const startSession = useCallback(() => {
    const shuffled = [...eligibleQuestions].sort(() => Math.random() - 0.5);
    setSessionQueue(shuffled);
    setCurrentIndex(0);
    setResults([]);
    const selectedTimer = timerSeconds;
    setTimerTotal(selectedTimer);
    setSessionState("active");
    if (selectedTimer > 0) {
      setTimerRunning(true);
    }
  }, [eligibleQuestions, timerSeconds]);

  useEffect(() => {
    if (timerRunning && !isPaused && timerTotal > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setTimerRunning(false);
            setSessionState("done");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning, isPaused, timerTotal]);

  useEffect(() => {
    if (sessionState === "active" && timerTotal > 0) {
      setTimerSeconds(timerTotal);
    }
  }, [sessionState, timerTotal]);

  const currentQuestion = sessionQueue[currentIndex];

  const handleMark = (status: "done" | "skipped") => {
    if (!currentQuestion) return;
    if (status === "done") {
      markRevised(currentQuestion.id);
    }
    const newResults = [...results, { question: currentQuestion, status }];
    setResults(newResults);
    if (currentIndex + 1 >= sessionQueue.length) {
      setSessionState("done");
      if (timerRef.current) clearInterval(timerRef.current);
      setTimerRunning(false);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  const resetSession = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSessionState("setup");
    setTimerRunning(false);
    setIsPaused(false);
    setTimerSeconds(0);
    setTimerTotal(0);
  };

  const togglePause = () => {
    setIsPaused((p) => !p);
    if (isPaused) {
      setTimerRunning(true);
    } else {
      setTimerRunning(false);
    }
  };

  if (sessionState === "setup") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Revision Mode</h2>
          <p className="text-muted-foreground">Focus on one topic at a time with a timed session.</p>
        </div>

        <div className="max-w-md mx-auto space-y-6 mt-8">
          <div className="rounded-xl border bg-card p-6 shadow-sm space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Topic to Revise</label>
              <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                <SelectTrigger data-testid="select-revision-topic">
                  <SelectValue placeholder="Select topic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Topics ({questions.length} questions)</SelectItem>
                  {allTopics.map((topic) => {
                    const count = questions.filter((q) => q.tags.includes(topic)).length;
                    return (
                      <SelectItem key={topic} value={topic} disabled={count === 0}>
                        {topic} ({count})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {eligibleQuestions.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {eligibleQuestions.length} question{eligibleQuestions.length !== 1 ? "s" : ""} will be queued
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Session Timer</label>
              <Select
                value={timerTotal.toString()}
                onValueChange={(v) => {
                  const val = parseInt(v);
                  setTimerTotal(val);
                  setTimerSeconds(val);
                }}
              >
                <SelectTrigger data-testid="select-timer">
                  <SelectValue placeholder="No Timer" />
                </SelectTrigger>
                <SelectContent>
                  {TIMER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value.toString()}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={startSession}
              disabled={eligibleQuestions.length === 0}
              data-testid="button-start-session"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Session
            </Button>
          </div>

          {questions.length === 0 && (
            <div className="text-center py-6 text-muted-foreground text-sm rounded-xl border border-dashed">
              Add questions first to start a revision session.
            </div>
          )}

          {allTopics.length > 0 && questions.length > 0 && (
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Your Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {allTopics.map((topic) => {
                  const count = questions.filter((q) => q.tags.includes(topic)).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={topic}
                      onClick={() => setSelectedTopic(topic)}
                      className={cn(
                        "text-xs px-3 py-1.5 rounded-full border font-medium transition-colors font-mono",
                        selectedTopic === topic
                          ? "bg-primary text-primary-foreground border-primary"
                          : "hover:bg-muted border-border text-muted-foreground hover:text-foreground"
                      )}
                      data-testid={`chip-topic-${topic}`}
                    >
                      #{topic} <span className="opacity-60 ml-1">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (sessionState === "done") {
    const done = results.filter((r) => r.status === "done").length;
    const skipped = results.filter((r) => r.status === "skipped").length;
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Session Complete</h2>
          <p className="text-muted-foreground">Great work! Here's your session summary.</p>
        </div>
        <div className="max-w-lg mx-auto space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border bg-card p-4 text-center shadow-sm">
              <div className="text-3xl font-bold text-emerald-500">{done}</div>
              <div className="text-xs text-muted-foreground mt-1">Revised</div>
            </div>
            <div className="rounded-xl border bg-card p-4 text-center shadow-sm">
              <div className="text-3xl font-bold text-amber-500">{skipped}</div>
              <div className="text-xs text-muted-foreground mt-1">Skipped</div>
            </div>
            <div className="rounded-xl border bg-card p-4 text-center shadow-sm">
              <div className="text-3xl font-bold text-primary">{results.length}</div>
              <div className="text-xs text-muted-foreground mt-1">Total</div>
            </div>
          </div>

          {results.length > 0 && (
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b bg-muted/30">
                <h3 className="text-sm font-semibold">Questions Covered</h3>
              </div>
              <div className="divide-y divide-border max-h-64 overflow-y-auto">
                {results.map(({ question, status }) => (
                  <div
                    key={question.id}
                    className="flex items-center justify-between px-4 py-2.5"
                  >
                    <span className="text-sm">{question.name}</span>
                    <Badge
                      variant={status === "done" ? "default" : "outline"}
                      className={cn(
                        "text-[10px]",
                        status === "done"
                          ? "bg-emerald-500 hover:bg-emerald-600"
                          : "text-amber-600 border-amber-300"
                      )}
                    >
                      {status === "done" ? "Revised" : "Skipped"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={resetSession} className="flex-1" data-testid="button-new-session">
              <RefreshCw className="h-4 w-4 mr-2" /> New Session
            </Button>
            <Button onClick={startSession} className="flex-1" data-testid="button-retry-session">
              <Play className="h-4 w-4 mr-2" /> Go Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const progress = sessionQueue.length > 0 ? (currentIndex / sessionQueue.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {selectedTopic === "all" ? "All Topics" : `#${selectedTopic}`} Session
          </h2>
          <p className="text-sm text-muted-foreground">
            Question {currentIndex + 1} of {sessionQueue.length}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {timerTotal > 0 && (
            <button
              onClick={togglePause}
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-pause-timer"
            >
              {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
            </button>
          )}
          <Button variant="ghost" size="sm" onClick={resetSession} data-testid="button-end-session">
            End Session
          </Button>
        </div>
      </div>

      <Progress value={progress} className="h-1.5" />

      <div className="max-w-2xl mx-auto">
        <div className="flex justify-center mb-6">
          {timerTotal > 0 ? (
            <TimerRing seconds={timerSeconds} total={timerTotal} />
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Timer className="h-4 w-4" />
              <span>No time limit</span>
            </div>
          )}
        </div>

        {currentQuestion && (
          <div className="rounded-xl border bg-card shadow-sm p-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap gap-2">
                  {currentQuestion.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="font-mono text-[11px]">
                      #{tag}
                    </Badge>
                  ))}
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[11px]",
                      currentQuestion.confidenceLevel <= 2
                        ? "border-red-300 text-red-600 dark:text-red-400"
                        : currentQuestion.confidenceLevel === 3
                        ? "border-amber-300 text-amber-600 dark:text-amber-400"
                        : "border-emerald-300 text-emerald-600 dark:text-emerald-400"
                    )}
                  >
                    Confidence {currentQuestion.confidenceLevel}/5
                  </Badge>
                </div>
                <h3 className="text-xl font-bold">{currentQuestion.name}</h3>
                <div className="text-sm text-muted-foreground">{currentQuestion.platform}</div>
              </div>
              {currentQuestion.link && (
                <a
                  href={currentQuestion.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                  data-testid="link-revision-problem"
                >
                  <ExternalLink className="h-5 w-5" />
                </a>
              )}
            </div>

            {currentQuestion.approach && (
              <details className="group">
                <summary className="cursor-pointer text-sm text-primary font-medium list-none flex items-center gap-1 select-none">
                  <ChevronRight className="h-4 w-4 group-open:rotate-90 transition-transform" />
                  Show Approach
                </summary>
                <div className="mt-3 bg-muted/50 rounded-lg p-4 text-sm font-mono whitespace-pre-wrap">
                  {currentQuestion.approach}
                </div>
              </details>
            )}

            {currentQuestion.mistakeNotes && (
              <details className="group">
                <summary className="cursor-pointer text-sm text-destructive font-medium list-none flex items-center gap-1 select-none">
                  <ChevronRight className="h-4 w-4 group-open:rotate-90 transition-transform" />
                  Mistake Notes
                </summary>
                <div className="mt-3 bg-destructive/10 rounded-lg p-4 text-sm whitespace-pre-wrap">
                  {currentQuestion.mistakeNotes}
                </div>
              </details>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-amber-300 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                onClick={() => handleMark("skipped")}
                data-testid="button-skip-question"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Skip
              </Button>
              <Button
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                onClick={() => handleMark("done")}
                data-testid="button-done-question"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Revised
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-4">
          <button
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors flex items-center gap-1 text-sm"
            data-testid="button-prev-question"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          <div className="flex gap-1">
            {sessionQueue.slice(Math.max(0, currentIndex - 2), currentIndex + 5).map((_, i) => {
              const idx = Math.max(0, currentIndex - 2) + i;
              return (
                <div
                  key={idx}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    idx === currentIndex
                      ? "bg-primary"
                      : idx < currentIndex
                      ? "bg-emerald-400"
                      : "bg-muted-foreground/20"
                  )}
                />
              );
            })}
          </div>
          <button
            onClick={() => handleMark("skipped")}
            className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 text-sm"
            data-testid="button-skip-next"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
