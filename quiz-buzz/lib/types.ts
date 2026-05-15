export interface Option {
  text: string;
  isCorrect?: boolean;
}

export interface Question {
  question: string;
  image?: string;
  options: string[];
  correctAnswers?: number[];
}

export interface QuizQuestion {
  question: string;
  image?: string;
  options: string[];
  correctAnswers: number[];
}

export interface Quiz {
  _id: string;
  title: string;
  description: string;
  createdBy: string;
  timer: number;
  questions: Question[];
  questionCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiListResponse<T> {
  success?: boolean;
  docs?: T[];
  data?: T[];
  page?: number;
  limit?: number;
  total?: number;
  pages?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export interface ApiSingleResponse<T> {
  success?: boolean;
  data?: T;
  doc?: T;
  item?: T;
}

export interface QuizListResponse {
  data: Quiz[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface Attempt {
  _id: string;
  userId: string;
  quizId: string;
  answers: (number[] | null)[];
  score: number;
  total?: number;
  correctAnswers?: number[][];
  completedAt: string;
}

export interface LeaderboardEntry extends Attempt {
  rank?: number;
}

export interface SubmitAttemptPayload {
  quizId: string;
  answers: (number[] | null)[];
  score: number;
}

export interface QuizCreatePayload {
  title: string;
  description: string;
  timer: number;
  questions: QuizQuestion[];
}
