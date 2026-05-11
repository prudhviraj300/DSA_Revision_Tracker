import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { BookOpen, CheckCircle, AlertTriangle, Target, Plus } from "lucide-react";
import { useQuestions, isDueForRevision, getNextRevisionDate } from "@/hooks/useQuestions";
import { StatsCard } from "@/components/StatsCard";
import { Button } from "@/components/ui/button";
import { QuestionForm } from "@/components/QuestionForm";
import { Badge } from "@/components/ui/badge";

export function Dashboard() {
  const { questions, addQuestion, markRevised } = useQuestions();

  const stats = useMemo(() => {
    const total = questions.length;
    const weak = questions.filter((q) => q.confidenceLevel <= 2).length;
    const strong = questions.filter((q) => q.confidenceLevel >= 4).length;

    const weakQuestions = questions.filter((q) => q.confidenceLevel <= 2);
    const tagCounts = weakQuestions.reduce((acc, q) => {
      q.tags.forEach((tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    let mostFrequentWeakTopic = "None";
    let maxCount = 0;
    Object.entries(tagCounts).forEach(([tag, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostFrequentWeakTopic = tag;
      }
    });

    const dueToday = questions.filter(isDueForRevision).sort((a, b) => {
      return getNextRevisionDate(a.lastRevised, a.confidenceLevel).getTime() - 
             getNextRevisionDate(b.lastRevised, b.confidenceLevel).getTime();
    });

    return { total, weak, strong, mostFrequentWeakTopic, dueToday };
  }, [questions]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Welcome back to your revision tracker.</p>
        </div>
        <QuestionForm
          onSubmit={addQuestion}
          trigger={
            <Button data-testid="button-add-question">
              <Plus className="mr-2 h-4 w-4" /> Add Question
            </Button>
          }
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Solved"
          value={stats.total}
          icon={<BookOpen className="h-4 w-4 text-muted-foreground" />}
          data-testid="stat-total"
        />
        <StatsCard
          title="Weak Topics"
          value={stats.weak}
          icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
          className="border-destructive/20"
          data-testid="stat-weak"
        />
        <StatsCard
          title="Strong Topics"
          value={stats.strong}
          icon={<CheckCircle className="h-4 w-4 text-green-500" />}
          data-testid="stat-strong"
        />
        <StatsCard
          title="Focus Next"
          value={stats.mostFrequentWeakTopic}
          icon={<Target className="h-4 w-4 text-primary" />}
          description="Most frequent weak tag"
          data-testid="stat-focus"
        />
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-bold tracking-tight mb-4">Due for Revision Today</h3>
        {stats.dueToday.length === 0 ? (
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-8 text-center text-muted-foreground">
            You're all caught up! No questions due for revision today.
          </div>
        ) : (
          <div className="grid gap-4">
            {stats.dueToday.map((q) => (
              <div
                key={q.id}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-muted/50"
                data-testid={`card-due-${q.id}`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-lg">{q.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {q.platform}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                    <span className="font-medium text-destructive">
                      Due: {format(getNextRevisionDate(q.lastRevised, q.confidenceLevel), "MMM d")}
                    </span>
                    <span>•</span>
                    <span>Confidence: {q.confidenceLevel}/5</span>
                  </div>
                </div>
                <Button
                  onClick={() => markRevised(q.id)}
                  data-testid={`button-mark-revised-${q.id}`}
                  variant="default"
                >
                  <CheckCircle className="mr-2 h-4 w-4" /> Mark Revised
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
