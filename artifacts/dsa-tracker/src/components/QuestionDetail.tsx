import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Question } from "@/types/question";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

interface QuestionDetailProps {
  question: Question | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuestionDetail({ question, open, onOpenChange }: QuestionDetailProps) {
  if (!question) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2 flex-wrap">
            {question.link ? (
              <a
                href={question.link}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline text-primary flex items-center gap-1.5"
                data-testid="link-detail-problem"
              >
                {question.name}
                <ExternalLink className="h-4 w-4 flex-shrink-0" />
              </a>
            ) : (
              question.name
            )}
            <Badge variant="outline">{question.platform}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {question.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="font-mono">
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Time Complexity</h4>
              <p className="font-mono text-sm bg-muted px-2 py-1 rounded inline-block">
                {question.timeComplexity || "N/A"}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Confidence</h4>
              <Badge 
                variant={
                  question.confidenceLevel <= 2 ? "destructive" :
                  question.confidenceLevel === 3 ? "default" : "secondary"
                }
              >
                Level {question.confidenceLevel}
              </Badge>
            </div>
          </div>

          {question.approach && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Approach</h4>
              <div className="bg-muted/50 p-4 rounded-md text-sm whitespace-pre-wrap font-mono">
                {question.approach}
              </div>
            </div>
          )}

          {question.mistakeNotes && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Mistakes & Notes</h4>
              <div className="bg-destructive/10 text-destructive-foreground p-4 rounded-md text-sm whitespace-pre-wrap">
                {question.mistakeNotes}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
