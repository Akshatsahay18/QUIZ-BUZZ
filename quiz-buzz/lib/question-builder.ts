export type BuilderOption = {
  id: string;
  text: string;
};

export type BuilderQuestion = {
  id: string;
  question: string;
  image?: string;
  options: BuilderOption[];
  correctOptionId: string | null;
  isUploading?: boolean;
};

export type QuestionErrors = {
  question?: string | null;
  image?: string | null;
  options?: Array<string | null>;
  correctOption?: string | null;
};

export const QUESTION_IMAGE_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const QUESTION_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export const createBuilderQuestion = (
  createId: (prefix?: string) => string
): BuilderQuestion => ({
  id: createId("q"),
  question: "",
  image: undefined,
  options: [0, 1, 2, 3].map(() => ({
    id: createId("o"),
    text: "",
  })),
  correctOptionId: null,
  isUploading: false,
});
