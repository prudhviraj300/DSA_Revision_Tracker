export type Difficulty = "Easy" | "Medium" | "Hard";

export interface SheetQuestion {
  id: string;
  name: string;
  topic: string;
  difficulty: Difficulty;
  link: string;
}

export interface Sheet {
  id: string;
  name: string;
  shortName: string;
  description: string;
  questions: SheetQuestion[];
  color: string;
}
