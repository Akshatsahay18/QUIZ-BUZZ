import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const questionSchema = new Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true
    },
    image: {
      type: String,
      trim: true
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (options: string[]) =>
          options.length === 4 && options.every((option) => option.trim() !== ""),
        message: "A question must include exactly 4 options."
      }
    },
    correctAnswer: {
      type: Number,
      required: true,
      select: false,
      min: 0,
      max: 3
    }
  },
  { _id: false }
);

const quizSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ""
    },
    createdBy: {
      type: String,
      required: true,
      index: true
    },
    timer: {
      type: Number,
      default: 600,
      min: 60,
      max: 10800
    },
    questions: {
      type: [questionSchema],
      required: true,
      validate: {
        validator: (questions: unknown[]) => questions.length >= 1,
        message: "A quiz must include at least 1 question."
      }
    }
  },
  { timestamps: true }
);

// Virtual field for question count
quizSchema.virtual("questionCount").get(function (this: any) {
  return Array.isArray(this.questions) ? this.questions.length : 0;
});

// Ensure virtuals are included when converting to JSON/objects
quizSchema.set("toJSON", { virtuals: true });
quizSchema.set("toObject", { virtuals: true });

export type Quiz = InferSchemaType<typeof quizSchema>;

const QuizModel: Model<Quiz> =
  mongoose.models.Quiz ?? mongoose.model<Quiz>("Quiz", quizSchema);

export default QuizModel;
