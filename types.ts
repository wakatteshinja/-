export enum AppMode {
  HOME = 'HOME',
  LEARN = 'LEARN',
  QUIZ = 'QUIZ',
  CHAT = 'CHAT',
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface LearningContent {
  title: string;
  summary: string;
  sections: {
    heading: string;
    content: string;
  }[];
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
