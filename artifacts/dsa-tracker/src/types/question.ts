export type Platform = "LeetCode" | "GFG" | "Codeforces" | "Other";

export type ConfidenceLevel = 1 | 2 | 3 | 4 | 5;

export interface Question {
  id: string;
  name: string;
  platform: Platform;
  tags: string[];
  approach: string;
  timeComplexity: string;
  confidenceLevel: ConfidenceLevel;
  lastRevised: string; // ISO date
  mistakeNotes: string;
}

export const TAGS = [
  "DP", "Graph", "Trees", "Sliding Window", "Binary Search",
  "Backtracking", "Greedy", "Two Pointers", "Linked List",
  "Stack", "Queue", "Heap", "Trie", "Bit Manipulation",
  "Math", "String", "Array", "Other"
];

export const PLATFORMS: Platform[] = ["LeetCode", "GFG", "Codeforces", "Other"];
