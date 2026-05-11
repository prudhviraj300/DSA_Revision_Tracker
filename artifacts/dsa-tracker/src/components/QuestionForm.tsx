import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Plus } from "lucide-react";

import { Question, PLATFORMS, TAGS, ConfidenceLevel } from "@/types/question";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(1, "Question name is required"),
  platform: z.enum(["LeetCode", "GFG", "Codeforces", "Other"]),
  tags: z.array(z.string()).min(1, "At least one tag is required"),
  approach: z.string(),
  timeComplexity: z.string(),
  confidenceLevel: z.coerce.number().min(1).max(5),
  lastRevised: z.string(),
  mistakeNotes: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

interface QuestionFormProps {
  initialData?: Question;
  onSubmit: (data: Omit<Question, "id">) => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function QuestionForm({ initialData, onSubmit, trigger, open, onOpenChange }: QuestionFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isControlled = open !== undefined && onOpenChange !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange : setInternalOpen;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      platform: initialData?.platform || "LeetCode",
      tags: initialData?.tags || [],
      approach: initialData?.approach || "",
      timeComplexity: initialData?.timeComplexity || "",
      confidenceLevel: initialData?.confidenceLevel || 3,
      lastRevised: initialData?.lastRevised || new Date().toISOString(),
      mistakeNotes: initialData?.mistakeNotes || "",
    },
  });

  const handleSubmit = (values: FormValues) => {
    onSubmit(values as Omit<Question, "id">);
    form.reset();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Question" : "Add Question"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Two Sum" {...field} data-testid="input-question-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="platform"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Platform</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-platform">
                          <SelectValue placeholder="Select platform" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PLATFORMS.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confidenceLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confidence Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value.toString()}>
                      <FormControl>
                        <SelectTrigger data-testid="select-confidence">
                          <SelectValue placeholder="Select confidence" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1 - Very Weak</SelectItem>
                        <SelectItem value="2">2 - Weak</SelectItem>
                        <SelectItem value="3">3 - Medium</SelectItem>
                        <SelectItem value="4">4 - Strong</SelectItem>
                        <SelectItem value="5">5 - Very Strong</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {TAGS.map((tag) => {
                        const isSelected = field.value.includes(tag);
                        return (
                          <Badge
                            key={tag}
                            variant={isSelected ? "default" : "outline"}
                            className="cursor-pointer hover:bg-primary/80"
                            onClick={() => {
                              const newValue = isSelected
                                ? field.value.filter((t) => t !== tag)
                                : [...field.value, tag];
                              field.onChange(newValue);
                            }}
                            data-testid={`badge-tag-${tag}`}
                          >
                            {tag}
                          </Badge>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="timeComplexity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time Complexity</FormLabel>
                  <FormControl>
                    <Input placeholder="O(N)" {...field} data-testid="input-time-complexity" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="approach"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Approach</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your approach..."
                      className="resize-none"
                      {...field}
                      data-testid="textarea-approach"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mistakeNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mistake Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notes on mistakes made..."
                      className="resize-none"
                      {...field}
                      data-testid="textarea-mistakes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastRevised"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Last Revised</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                          data-testid="button-date-picker"
                        >
                          {field.value ? (
                            format(parseISO(field.value), "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? parseISO(field.value) : undefined}
                        onSelect={(date) => {
                          if (date) field.onChange(date.toISOString());
                        }}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" data-testid="button-submit-question">
              {initialData ? "Save Changes" : "Add Question"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
