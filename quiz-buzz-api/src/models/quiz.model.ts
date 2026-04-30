import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const questionSchema = new Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (options: string[]) => options.length === 4,
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
      default: 0,
      min: 0
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

export type Quiz = InferSchemaType<typeof quizSchema>;

const QuizModel: Model<Quiz> =
  mongoose.models.Quiz ?? mongoose.model<Quiz>("Quiz", quizSchema);

export default QuizModel;
