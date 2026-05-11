import { useState } from "react";
import { BookOpen, CheckCircle2, ChevronRight, RotateCcw, ExternalLink } from "lucide-react";
import { SHEETS } from "@/data/sheets/index";
import { Sheet, SheetQuestion, Difficulty } from "@/types/sheet";
import { useSheetProgress, useAllSheetStats } from "@/hooks/useSheetProgress";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

function SheetDetailView({
  sheet,
  onBack,
}: {
  sheet: Sheet;
  onBack: () => void;
}) {
  const { completedIds, completedCount, toggleComplete, clearProgress } =
    useSheetProgress(sheet.id);

  const [search, setSearch] = useState("");
  const [topicFilter, setTopicFilter] = useState("all");
  const [diffFilter, setDiffFilter] = useState<"all" | Difficulty>("all");
  const [showOnlyPending, setShowOnlyPending] = useState(false);

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

  return (
    <div className="space-y-6">
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

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{sheet.name}</h2>
          <p className="text-muted-foreground text-sm mt-1">{sheet.description}</p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" data-testid="button-reset-progress">
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset Progress
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset all progress?</AlertDialogTitle>
              <AlertDialogDescription>
                This will clear all completed marks for {sheet.name}. This cannot be undone.
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

      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            {completedCount} / {sheet.questions.length} completed
          </span>
          <span className="text-sm font-bold text-primary">{percent}%</span>
        </div>
        <Progress value={percent} className={cn("h-2.5", PROGRESS_COLORS[sheet.color])} />
        <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
          {(["Easy", "Medium", "Hard"] as Difficulty[]).map((d) => {
            const total = sheet.questions.filter((q) => q.difficulty === d).length;
            const done = sheet.questions.filter(
              (q) => q.difficulty === d && completedIds.has(q.id)
            ).length;
            return (
              <span key={d} className={cn("font-medium", DIFF_COLORS[d], "px-2 py-0.5 rounded-md")}>
                {d}: {done}/{total}
              </span>
            );
          })}
        </div>
      </div>

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
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
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

      <div className="space-y-6">
        {Object.entries(groupedByTopic).map(([topic, questions]) => {
          const doneInTopic = questions.filter((q) => completedIds.has(q.id)).length;
          return (
            <div key={topic}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {topic}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {doneInTopic}/{questions.length}
                </span>
              </div>
              <div className="rounded-xl border bg-card divide-y divide-border overflow-hidden shadow-sm">
                {questions.map((q) => {
                  const done = completedIds.has(q.id);
                  return (
                    <div
                      key={q.id}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40",
                        done && "bg-emerald-50/40 dark:bg-emerald-950/10"
                      )}
                      data-testid={`row-question-${q.id}`}
                    >
                      <button
                        onClick={() => toggleComplete(q.id)}
                        className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                          done
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : "border-muted-foreground/40 hover:border-emerald-400"
                        )}
                        data-testid={`check-${q.id}`}
                      >
                        {done && <CheckCircle2 className="h-3 w-3" />}
                      </button>
                      <span
                        className={cn(
                          "flex-1 text-sm font-medium",
                          done && "line-through text-muted-foreground"
                        )}
                      >
                        {q.name}
                      </span>
                      <span
                        className={cn(
                          "text-[11px] px-2 py-0.5 rounded-md font-medium shrink-0",
                          DIFF_COLORS[q.difficulty]
                        )}
                      >
                        {q.difficulty}
                      </span>
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
          Track your progress through curated DSA problem sets.
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
    </div>
  );
}
