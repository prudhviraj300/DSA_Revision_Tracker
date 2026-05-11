import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Search, SlidersHorizontal, Edit2, Trash2, CheckCircle, ExternalLink } from "lucide-react";
import { useQuestions, isDueForRevision, getNextRevisionDate } from "@/hooks/useQuestions";
import { Question, ConfidenceLevel, Platform, TAGS } from "@/types/question";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { QuestionForm } from "@/components/QuestionForm";
import { QuestionDetail } from "@/components/QuestionDetail";
import { cn } from "@/lib/utils";

type SortField = "name" | "confidence" | "lastRevised" | "nextRevision";
type SortDirection = "asc" | "desc";

export function Questions() {
  const { questions, updateQuestion, deleteQuestion, markRevised } = useQuestions();

  const [search, setSearch] = useState("");
  const [selectedConfidence, setSelectedConfidence] = useState<ConfidenceLevel[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>("nextRevision");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [viewingQuestion, setViewingQuestion] = useState<Question | null>(null);

  const filteredAndSorted = useMemo(() => {
    return questions
      .filter((q) => {
        const matchesSearch = q.name.toLowerCase().includes(search.toLowerCase()) || q.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
        const matchesConfidence = selectedConfidence.length === 0 || selectedConfidence.includes(q.confidenceLevel);
        const matchesTags = selectedTags.length === 0 || selectedTags.some(t => q.tags.includes(t));
        return matchesSearch && matchesConfidence && matchesTags;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortField === "name") {
          cmp = a.name.localeCompare(b.name);
        } else if (sortField === "confidence") {
          cmp = a.confidenceLevel - b.confidenceLevel;
        } else if (sortField === "lastRevised") {
          cmp = new Date(a.lastRevised).getTime() - new Date(b.lastRevised).getTime();
        } else if (sortField === "nextRevision") {
          const nextA = getNextRevisionDate(a.lastRevised, a.confidenceLevel).getTime();
          const nextB = getNextRevisionDate(b.lastRevised, b.confidenceLevel).getTime();
          cmp = nextA - nextB;
        }
        return sortDirection === "asc" ? cmp : -cmp;
      });
  }, [questions, search, selectedConfidence, selectedTags, sortField, sortDirection]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getRowClassName = (confidenceLevel: number) => {
    if (confidenceLevel <= 2) return "bg-red-500/5 hover:bg-red-500/10 dark:bg-red-500/10 dark:hover:bg-red-500/20";
    if (confidenceLevel === 3) return "bg-amber-500/5 hover:bg-amber-500/10 dark:bg-amber-500/10 dark:hover:bg-amber-500/20";
    return "bg-emerald-500/5 hover:bg-emerald-500/10 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20";
  };

  const getConfidenceBadgeColor = (level: number) => {
    if (level <= 2) return "destructive";
    if (level === 3) return "default"; // Will style as amber roughly based on generic secondary, let's use outline with custom color
    return "secondary";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search questions or tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" data-testid="button-filter">
                <SlidersHorizontal className="mr-2 h-4 w-4" /> Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Confidence Level</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {[1, 2, 3, 4, 5].map((level) => (
                <DropdownMenuCheckboxItem
                  key={level}
                  checked={selectedConfidence.includes(level as ConfidenceLevel)}
                  onCheckedChange={(checked) => {
                    setSelectedConfidence(prev =>
                      checked
                        ? [...prev, level as ConfidenceLevel]
                        : prev.filter(l => l !== level)
                    );
                  }}
                >
                  Level {level}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Tags</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-[200px] overflow-y-auto">
                {TAGS.map((tag) => (
                  <DropdownMenuCheckboxItem
                    key={tag}
                    checked={selectedTags.includes(tag)}
                    onCheckedChange={(checked) => {
                      setSelectedTags(prev =>
                        checked
                          ? [...prev, tag]
                          : prev.filter(t => t !== tag)
                      );
                    }}
                  >
                    {tag}
                  </DropdownMenuCheckboxItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => toggleSort("name")}>
                Question Name {sortField === "name" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort("confidence")}>
                Confidence {sortField === "confidence" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead className="cursor-pointer hidden md:table-cell" onClick={() => toggleSort("lastRevised")}>
                Last Revised {sortField === "lastRevised" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort("nextRevision")}>
                Next Revision {sortField === "nextRevision" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No questions found.
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSorted.map((q) => (
                <TableRow key={q.id} className={cn(getRowClassName(q.confidenceLevel))}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-1.5">
                      <button
                        className="hover:underline text-left text-primary"
                        onClick={() => setViewingQuestion(q)}
                        data-testid={`link-question-${q.id}`}
                      >
                        {q.name}
                      </button>
                      {q.link && (
                        <a
                          href={q.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors"
                          title="Open problem"
                          data-testid={`link-external-${q.id}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{q.platform}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {q.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="outline" className="text-[10px] px-1 py-0 h-4 bg-background/50 font-mono">
                          #{tag}
                        </Badge>
                      ))}
                      {q.tags.length > 3 && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-background/50">
                          +{q.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getConfidenceBadgeColor(q.confidenceLevel)} className={
                      q.confidenceLevel === 3 ? "bg-amber-500 hover:bg-amber-600 text-white" : ""
                    }>
                      {q.confidenceLevel}/5
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                    {format(new Date(q.lastRevised), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    {isDueForRevision(q) ? (
                      <Badge variant="destructive" className="animate-pulse">Revise Now</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {format(getNextRevisionDate(q.lastRevised, q.confidenceLevel), "MMM d")}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => markRevised(q.id)}
                        title="Mark as Revised Today"
                        data-testid={`btn-mark-${q.id}`}
                      >
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingQuestion(q)}
                        data-testid={`btn-edit-${q.id}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" data-testid={`btn-delete-${q.id}`}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the record for "{q.name}". This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteQuestion(q.id)} className="bg-destructive hover:bg-destructive/90">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <QuestionForm
        initialData={editingQuestion || undefined}
        open={!!editingQuestion}
        onOpenChange={(open) => !open && setEditingQuestion(null)}
        onSubmit={(data) => {
          if (editingQuestion) {
            updateQuestion(editingQuestion.id, data);
          }
        }}
      />

      <QuestionDetail
        question={viewingQuestion}
        open={!!viewingQuestion}
        onOpenChange={(open) => !open && setViewingQuestion(null)}
      />
    </div>
  );
}
