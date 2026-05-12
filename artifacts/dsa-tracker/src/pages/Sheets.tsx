import { useState, useCallback } from "react";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  RotateCcw,
  ExternalLink,
  Download,
  PlusCircle,
  Sparkles,
} from "lucide-react";
import { SHEETS } from "@/data/sheets/index";
import { Sheet, SheetQuestion, Difficulty } from "@/types/sheet";
import { useSheetProgress, useAllSheetStats } from "@/hooks/useSheetProgress";
import { useQuestions } from "@/hooks/useQuestions";
import { Question, Platform, ConfidenceLevel } from "@/types/question";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ── helpers ──────────────────────────────────────────────────────────────────

function detectPlatform(link: string): Platform {
  if (link.includes("leetcode.com")) return "LeetCode";
  if (link.includes("geeksforgeeks.org")) return "GFG";
  if (link.includes("codeforces.com")) return "Codeforces";
  return "Other";
}

function diffToConfidence(difficulty: Difficulty): ConfidenceLevel {
  if (difficulty === "Easy") return 3;
  if (difficulty === "Medium") return 2;
  return 1;
}

function sheetQuestionToPersonal(q: SheetQuestion): Omit<Question, "id"> {
  return {
    name: q.name,
    platform: detectPlatform(q.link),
    link: q.link,
    tags: [q.topic],
    approach: "",
    timeComplexity: "",
    confidenceLevel: diffToConfidence(q.difficulty),
    lastRevised: new Date().toISOString(),
    mistakeNotes: "",
  };
}

// ── color maps ────────────────────────────────────────────────────────────────

const SHEET_COLORS: Record<string, string> = {
  blue: "border-blue-400/40 bg-blue-50/30 dark:bg-blue-950/20",
  green: "border-emerald-400/40 bg-emerald-50/30 dark:bg-emerald-950/20",
  purple: "border-purple-400/40 bg-purple-50/30 dark:bg-purple-950/20",
  orange: "border-orange-400/40 bg-orange-50/30 dark:bg-orange-950/20",
};

const BADGE_COLORS: Record<string, string> = {
  blue: "bg-blue-500",
  green: "bg-emerald-500",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
};

const PROGRESS_COLORS: Record<string, string> = {
  blue: "[&>div]:bg-blue-500",
  green: "[&>div]:bg-emerald-500",
  purple: "[&>div]:bg-purple-500",
  orange: "[&>div]:bg-orange-500",
};

const DIFF_COLORS: Record<Difficulty, string> = {
  Easy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  Medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  Hard: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
};

// ── SheetDetailView ───────────────────────────────────────────────────────────

function SheetDetailView({ sheet, onBack }: { sheet: Sheet; onBack: () => void }) {
  const { completedIds, completedCount, toggleComplete, clearProgress } =
    useSheetProgress(sheet.id);
  const { questions, addQuestion } = useQuestions();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [topicFilter, setTopicFilter] = useState("all");
  const [diffFilter, setDiffFilter] = useState<"all" | Difficulty>("all");
  const [showOnlyPending, setShowOnlyPending] = useState(false);

  const personalNames = new Set(questions.map((q) => q.name.trim().toLowerCase()));

  const isInPersonal = useCallback(
    (name: string) => personalNames.has(name.trim().toLowerCase()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [questions]
  );

  const handleToggle = useCallback(
    (sheetQ: SheetQuestion) => {
      const wasComplete = completedIds.has(sheetQ.id);
      toggleComplete(sheetQ.id);

      if (!wasComplete) {
        // Marking as complete → auto-add to personal questions if not there
        if (!isInPersonal(sheetQ.name)) {
          addQuestion(sheetQuestionToPersonal(sheetQ));
          toast({
            title: "Added to My Questions",
            description: `"${sheetQ.name}" was added to All Questions automatically.`,
          });
        }
      }
    },
    [completedIds, toggleComplete, isInPersonal, addQuestion, toast]
  );

  const handleImportAll = useCallback(
    (questionsToImport: SheetQuestion[]) => {
      let added = 0;
      questionsToImport.forEach((q) => {
        if (!isInPersonal(q.name)) {
          addQuestion(sheetQuestionToPersonal(q));
          added++;
        }
      });
      toast({
        title: added > 0 ? `Imported ${added} questions` : "Nothing new to import",
        description:
          added > 0
            ? `${added} question${added !== 1 ? "s" : ""} added to My Questions.`
            : "All selected questions are already in your list.",
      });
    },
    [isInPersonal, addQuestion, toast]
  );

  const topics = Array.from(new Set(sheet.questions.map((q) => q.topic))).sort();
  const percent = Math.round((completedCount / sheet.questions.length) * 100);

  const filtered = sheet.questions.filter((q) => {
    const matchSearch = q.name.toLowerCase().includes(search.toLowerCase());
    const matchTopic = topicFilter === "all" || q.topic === topicFilter;
    const matchDiff = diffFilter === "all" || q.difficulty === diffFilter;
    const matchPending = !showOnlyPending || !completedIds.has(q.id);
    return matchSearch && matchTopic && matchDiff && matchPending;
  });

  const groupedByTopic = filtered.reduce(
    (acc, q) => {
      if (!acc[q.topic]) acc[q.topic] = [];
      acc[q.topic].push(q);
      return acc;
    },
    {} as Record<string, SheetQuestion[]>
  );

  const pendingQuestions = sheet.questions.filter((q) => !completedIds.has(q.id));
  const notImportedCount = sheet.questions.filter((q) => !isInPersonal(q.name)).length;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1 transition-colors"
          data-testid="button-back-sheets"
        >
          ← Sheets
        </button>
        <span className="text-muted-foreground">/</span>
        <span className="font-semibold">{sheet.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{sheet.name}</h2>
          <p className="text-muted-foreground text-sm mt-1">{sheet.description}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {/* Bulk import button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" data-testid="button-import-all">
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Import All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Import entire sheet?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will add all {notImportedCount} question
                  {notImportedCount !== 1 ? "s" : ""} from {sheet.name} that are not
                  already in your personal list. You can then edit each one with your
                  own notes, approach and confidence rating.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleImportAll(sheet.questions)}
                  data-testid="confirm-import-all"
                >
                  Import {notImportedCount} Questions
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" data-testid="button-reset-progress">
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset all progress?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will clear all completed marks for {sheet.name}. Questions
                  already imported to My Questions will remain there.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={clearProgress}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Reset
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Progress card */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            {completedCount} / {sheet.questions.length} completed
          </span>
          <span className="text-sm font-bold text-primary">{percent}%</span>
        </div>
        <Progress value={percent} className={cn("h-2.5", PROGRESS_COLORS[sheet.color])} />
        <div className="flex flex-wrap gap-3 mt-3 text-xs">
          {(["Easy", "Medium", "Hard"] as Difficulty[]).map((d) => {
            const total = sheet.questions.filter((q) => q.difficulty === d).length;
            const done = sheet.questions.filter(
              (q) => q.difficulty === d && completedIds.has(q.id)
            ).length;
            return (
              <span key={d} className={cn("font-medium px-2 py-0.5 rounded-md", DIFF_COLORS[d])}>
                {d}: {done}/{total}
              </span>
            );
          })}
          <span className="ml-auto text-muted-foreground font-medium px-2 py-0.5">
            {questions.length - (questions.length - (sheet.questions.length - notImportedCount))} already in My Questions
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="Search questions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
          data-testid="input-sheet-search"
        />
        <Select value={topicFilter} onValueChange={setTopicFilter}>
          <SelectTrigger className="w-full sm:w-44" data-testid="select-topic-filter">
            <SelectValue placeholder="All Topics" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Topics</SelectItem>
            {topics.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={diffFilter} onValueChange={(v) => setDiffFilter(v as "all" | Difficulty)}>
          <SelectTrigger className="w-full sm:w-36" data-testid="select-diff-filter">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Easy">Easy</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Hard">Hard</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant={showOnlyPending ? "default" : "outline"}
          size="sm"
          onClick={() => setShowOnlyPending((p) => !p)}
          data-testid="button-show-pending"
          className="shrink-0"
        >
          Pending only
        </Button>
      </div>

      {/* Question list grouped by topic */}
      <div className="space-y-6">
        {Object.entries(groupedByTopic).map(([topic, qs]) => {
          const doneInTopic = qs.filter((q) => completedIds.has(q.id)).length;
          return (
            <div key={topic}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {topic}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {doneInTopic}/{qs.length}
                </span>
              </div>
              <div className="rounded-xl border bg-card divide-y divide-border overflow-hidden shadow-sm">
                {qs.map((q) => {
                  const done = completedIds.has(q.id);
                  const inPersonal = isInPersonal(q.name);
                  return (
                    <div
                      key={q.id}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40",
                        done && "bg-emerald-50/40 dark:bg-emerald-950/10"
                      )}
                      data-testid={`row-question-${q.id}`}
                    >
                      {/* Completion circle */}
                      <button
                        onClick={() => handleToggle(q)}
                        className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                          done
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : "border-muted-foreground/40 hover:border-emerald-400"
                        )}
                        data-testid={`check-${q.id}`}
                        title={done ? "Mark as pending" : "Mark as completed"}
                      >
                        {done && <CheckCircle2 className="h-3 w-3" />}
                      </button>

                      {/* Name */}
                      <span
                        className={cn(
                          "flex-1 text-sm font-medium min-w-0 truncate",
                          done && "line-through text-muted-foreground"
                        )}
                      >
                        {q.name}
                      </span>

                      {/* "In My Questions" badge */}
                      {inPersonal && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-semibold shrink-0"
                          title="Already in My Questions"
                        >
                          ✓ Saved
                        </span>
                      )}

                      {/* Difficulty */}
                      <span
                        className={cn(
                          "text-[11px] px-2 py-0.5 rounded-md font-medium shrink-0",
                          DIFF_COLORS[q.difficulty]
                        )}
                      >
                        {q.difficulty}
                      </span>

                      {/* Add to personal (if not already there) */}
                      {!inPersonal && (
                        <button
                          onClick={() => {
                            addQuestion(sheetQuestionToPersonal(q));
                            toast({
                              title: "Added to My Questions",
                              description: `"${q.name}" was added to your personal list.`,
                            });
                          }}
                          className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                          title="Add to My Questions"
                          data-testid={`add-personal-${q.id}`}
                        >
                          <PlusCircle className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {/* External link */}
                      <a
                        href={q.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                        title="Open problem"
                        data-testid={`link-sheet-problem-${q.id}`}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {Object.keys(groupedByTopic).length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No questions match your filters.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sheets (list view) ────────────────────────────────────────────────────────

export function Sheets() {
  const [selectedSheet, setSelectedSheet] = useState<Sheet | null>(null);
  const stats = useAllSheetStats(SHEETS);

  if (selectedSheet) {
    return (
      <SheetDetailView
        sheet={selectedSheet}
        onBack={() => setSelectedSheet(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">DSA Sheets</h2>
        <p className="text-muted-foreground">
          Track your progress through curated problem sets. Marking a question
          complete automatically adds it to your personal question list.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {SHEETS.map((sheet) => {
          const stat = stats.find((s) => s.sheetId === sheet.id);
          return (
            <button
              key={sheet.id}
              onClick={() => setSelectedSheet(sheet)}
              className={cn(
                "text-left rounded-xl border p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",
                SHEET_COLORS[sheet.color]
              )}
              data-testid={`card-sheet-${sheet.id}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={cn(
                        "text-xs font-bold text-white px-2 py-0.5 rounded-md",
                        BADGE_COLORS[sheet.color]
                      )}
                    >
                      {sheet.shortName}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold">{sheet.name}</h3>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground mt-1" />
              </div>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {sheet.description}
              </p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {stat?.completed ?? 0} / {stat?.total ?? sheet.questions.length}
                  </span>
                  <span className="font-semibold">{stat?.percent ?? 0}%</span>
                </div>
                <Progress
                  value={stat?.percent ?? 0}
                  className={cn("h-2", PROGRESS_COLORS[sheet.color])}
                />
              </div>
              <div className="flex gap-2 mt-3">
                {(["Easy", "Medium", "Hard"] as Difficulty[]).map((d) => {
                  const count = sheet.questions.filter((q) => q.difficulty === d).length;
                  return (
                    <Badge
                      key={d}
                      variant="outline"
                      className={cn("text-[10px] px-1.5 py-0", DIFF_COLORS[d])}
                    >
                      {count} {d}
                    </Badge>
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>

      {/* Overall summary */}
      <div className="rounded-xl border bg-muted/30 p-5">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Overall Progress</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {SHEETS.map((sheet) => {
            const stat = stats.find((s) => s.sheetId === sheet.id);
            return (
              <div key={sheet.id} className="text-center">
                <div className="text-2xl font-bold">{stat?.percent ?? 0}%</div>
                <div className="text-xs text-muted-foreground mt-0.5">{sheet.shortName}</div>
                <div className="text-xs text-muted-foreground">
                  {stat?.completed}/{stat?.total}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info callout */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
        <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground">
          <span className="text-foreground font-medium">Auto-import:</span> When you
          mark a problem as completed inside a sheet, it is automatically added to your{" "}
          <span className="font-medium text-foreground">All Questions</span> list —
          pre-filled with the topic, platform, and a starting confidence rating. You
          can then enrich it with your own notes and approach.
        </p>
      </div>
    </div>
  );
}
