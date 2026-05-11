import { Sheet } from "@/types/sheet";
import { blind75Questions } from "./blind75";
import { neetcode150Questions } from "./neetcode150";
import { grind169Questions } from "./grind169";
import { striverA2ZQuestions } from "./striverA2Z";

export const SHEETS: Sheet[] = [
  {
    id: "blind75",
    name: "Blind 75",
    shortName: "B75",
    description: "The classic 75 LeetCode problems curated by tech lead. Essential for FAANG interviews.",
    questions: blind75Questions,
    color: "blue",
  },
  {
    id: "neetcode150",
    name: "NeetCode 150",
    shortName: "NC150",
    description: "150 problems handpicked by NeetCode covering every important pattern for coding interviews.",
    questions: neetcode150Questions,
    color: "green",
  },
  {
    id: "grind169",
    name: "Grind 169",
    shortName: "G169",
    description: "169 problems by Sean Prashad, an extended and structured version of Blind 75.",
    questions: grind169Questions,
    color: "purple",
  },
  {
    id: "striverA2Z",
    name: "Striver A2Z DSA",
    shortName: "A2Z",
    description: "Striver's comprehensive A to Z DSA sheet covering fundamentals to advanced topics.",
    questions: striverA2ZQuestions,
    color: "orange",
  },
];

export { blind75Questions, neetcode150Questions, grind169Questions, striverA2ZQuestions };
