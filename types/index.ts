export type Grade = 'junior' | 'senior';

export type Subject = 'physics' | 'chemistry';

export type Category = 
  | 'sound' | 'light' | 'heat' | 'force' | 'electricity' | 'motion'
  | 'chem_gas' | 'chem_burning' | 'chem_solution' | 'chem_metal' | 'chem_acidbase';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number; // Index of options (0-3)
  explanation: string;
}

export interface Quiz {
  questions: QuizQuestion[];
}

export interface TheoryContent {
  title: string;
  formula: string; // HTML/Unicode or simple KaTeX markup
  description: string;
  points: string[];
}

export interface TextbookContent {
  page: string;       // 教材对应页码，如“人教版九年级化学上册 第79页”
  goal: string;       // 实验目的
  apparatus: string;  // 实验器材
  steps: string[];    // 实验步骤
  phenomenon: string; // 实验现象
  equation: string;   // 化学方程式/反应原理
  conclusion: string; // 实验结论
}

export interface SimulationInfo {
  id: string;
  name: string;
  grade: Grade;
  category: Category;
  subject?: Subject; // Defaults to 'physics' if undefined
  description: string;
  quiz: Quiz;
  theory: TheoryContent;
  textbook?: TextbookContent;
  component: React.ComponentType<{
    isPlaying: boolean;
    isGridVisible: boolean;
    isVectorVisible: boolean;
    simSpeed: number;
    parameters: any;
    onRecordData: (data: any) => void;
  }>;
}

export interface CategoryInfo {
  id: Category;
  name: string;
  icon: string;
}
