import { useMemo } from "react";
import {
  format,
  subWeeks,
  startOfWeek,
  eachDayOfInterval,
  isSameDay,
  parseISO,
  differenceInCalendarDays,
  subDays,
} from "date-fns";
import { Flame, Calendar, TrendingUp, Zap } from "lucide-react";
import { useQuestions } from "@/hooks/useQuestions";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const CELL = 13;
const GAP = 2;
const TOTAL = CELL + GAP;
const DAY_LABEL_W = 28;

const LEVEL_CLASSES = [
  "bg-muted/60 border border-border/30",
  "bg-emerald-200 dark:bg-emerald-900 border border-emerald-300/60 dark:border-emerald-800",
  "bg-emerald-300 dark:bg-emerald-700 border border-emerald-400/60 dark:border-emerald-600",
  "bg-emerald-500 dark:bg-emerald-500 border border-emerald-600/60 dark:border-emerald-400",
  "bg-emerald-600 dark:bg-emerald-300 border border-emerald-700/60 dark:border-emerald-200",
];

function getLevel(count: number) {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

interface DayCell {
  date: Date;
  dateStr: string;
  count: number;
  isFuture: boolean;
  isToday: boolean;
}

function StatCard({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 shadow-sm flex flex-col gap-2",
        highlight && "border-orange-400/40 bg-orange-50/50 dark:bg-orange-900/10"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground font-medium">{label}</span>
        {icon}
      </div>
      <span className="text-2xl font-bold tracking-tight">{value}</span>
    </div>
  );
}

export function HeatMap() {
  const { revisionLog } = useQuestions();

  const { weeks, monthLabels, stats } = useMemo(() => {
    const dateCountMap = new Map<string, number>();
    revisionLog.forEach((d) => {
      dateCountMap.set(d, (dateCountMap.get(d) ?? 0) + 1);
    });

    const today = new Date();
    const startDate = startOfWeek(subWeeks(today, 52), { weekStartsOn: 0 });
    const allDays = eachDayOfInterval({ start: startDate, end: today });

    const weeks: DayCell[][] = [];
    let currentWeek: DayCell[] = [];

    allDays.forEach((day, idx) => {
      const dateStr = format(day, "yyyy-MM-dd");
      currentWeek.push({
        date: day,
        dateStr,
        count: dateCountMap.get(dateStr) ?? 0,
        isFuture: day > today,
        isToday: isSameDay(day, today),
      });
      if (currentWeek.length === 7 || idx === allDays.length - 1) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    const monthLabels: { label: string; weekIndex: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, wi) => {
      const m = week[0].date.getMonth();
      if (m !== lastMonth) {
        monthLabels.push({ label: format(week[0].date, "MMM"), weekIndex: wi });
        lastMonth = m;
      }
    });

    // Streak calculation uses unique sorted dates
    const uniqueDates = Array.from(new Set(revisionLog)).sort();

    // Longest streak
    let longestStreak = 0;
    let streak = 0;
    let prevDate: Date | null = null;
    uniqueDates.forEach((ds) => {
      const d = parseISO(ds);
      if (prevDate && differenceInCalendarDays(d, prevDate) === 1) {
        streak++;
      } else {
        streak = 1;
      }
      if (streak > longestStreak) longestStreak = streak;
      prevDate = d;
    });

    // Current streak — count backwards from today
    let currentStreak = 0;
    const todayStr = format(today, "yyyy-MM-dd");
    const yesterdayStr = format(subDays(today, 1), "yyyy-MM-dd");
    let checkDate =
      dateCountMap.has(todayStr)
        ? today
        : dateCountMap.has(yesterdayStr)
        ? subDays(today, 1)
        : null;

    if (checkDate) {
      while (dateCountMap.has(format(checkDate, "yyyy-MM-dd"))) {
        currentStreak++;
        checkDate = subDays(checkDate, 1);
      }
    }

    const totalActiveDays = uniqueDates.length;
    const totalRevisions = revisionLog.length;

    return {
      weeks,
      monthLabels,
      stats: { currentStreak, longestStreak, totalActiveDays, totalRevisions },
    };
  }, [revisionLog]);

  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Revision Heatmap</h2>
        <p className="text-muted-foreground">
          Your DSA revision activity over the past year.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Flame className="h-4 w-4 text-orange-500" />}
          label="Current Streak"
          value={`${stats.currentStreak} day${stats.currentStreak !== 1 ? "s" : ""}`}
          highlight={stats.currentStreak > 0}
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4 text-primary" />}
          label="Longest Streak"
          value={`${stats.longestStreak} day${stats.longestStreak !== 1 ? "s" : ""}`}
        />
        <StatCard
          icon={<Calendar className="h-4 w-4 text-blue-500" />}
          label="Active Days"
          value={stats.totalActiveDays.toString()}
        />
        <StatCard
          icon={<Zap className="h-4 w-4 text-yellow-500" />}
          label="Total Revisions"
          value={stats.totalRevisions.toString()}
        />
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="overflow-x-auto pb-2">
          <div className="min-w-max">
            {/* Month labels */}
            <div
              className="relative mb-1"
              style={{ height: 18, marginLeft: DAY_LABEL_W + 4 }}
            >
              {monthLabels.map(({ label, weekIndex }) => (
                <span
                  key={`${label}-${weekIndex}`}
                  className="absolute text-[11px] text-muted-foreground font-medium"
                  style={{ left: weekIndex * TOTAL }}
                >
                  {label}
                </span>
              ))}
            </div>

            <div className="flex" style={{ gap: GAP }}>
              {/* Day-of-week labels */}
              <div
                className="flex flex-col shrink-0"
                style={{ gap: GAP, width: DAY_LABEL_W, marginTop: 1 }}
              >
                {DAY_LABELS.map((label, i) => (
                  <div
                    key={i}
                    style={{ height: CELL }}
                    className="flex items-center justify-end pr-1 text-[10px] text-muted-foreground"
                  >
                    {i % 2 === 1 ? label : ""}
                  </div>
                ))}
              </div>

              {/* Week columns */}
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col" style={{ gap: GAP }}>
                  {week.map((day) => (
                    <Tooltip key={day.dateStr}>
                      <TooltipTrigger asChild>
                        <div
                          style={{ width: CELL, height: CELL }}
                          className={cn(
                            "rounded-sm transition-opacity",
                            day.isFuture
                              ? "opacity-0 pointer-events-none"
                              : LEVEL_CLASSES[getLevel(day.count)],
                            day.isToday && "ring-2 ring-primary ring-offset-1 ring-offset-card"
                          )}
                          data-testid={`heatmap-cell-${day.dateStr}`}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        <p className="font-semibold">
                          {format(day.date, "MMM d, yyyy")}
                        </p>
                        <p className="text-muted-foreground">
                          {day.count === 0
                            ? "No revisions"
                            : `${day.count} revision${day.count !== 1 ? "s" : ""}`}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 mt-4 ml-8">
              <span className="text-[11px] text-muted-foreground">Less</span>
              {LEVEL_CLASSES.map((cls, i) => (
                <div
                  key={i}
                  style={{ width: CELL, height: CELL }}
                  className={cn("rounded-sm", cls)}
                />
              ))}
              <span className="text-[11px] text-muted-foreground">More</span>
            </div>
          </div>
        </div>
      </div>

      {stats.totalRevisions === 0 && (
        <div className="rounded-xl border bg-muted/30 p-8 text-center text-muted-foreground text-sm">
          No revision activity yet. Add questions and use "Mark as Revised" to build your streak.
        </div>
      )}
    </div>
  );
}
