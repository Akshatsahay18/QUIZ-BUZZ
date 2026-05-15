import {
  allowPublic,
  createMongooseAdapter,
  defineResource,
  requireAuth
} from "@classytic/arc";
import { buildCrudSchemasFromModel, createRepository } from "@classytic/mongokit";

import QuizModel, { type Quiz } from "../models/quiz.model.js";

const quizRepository = createRepository(QuizModel);

type ResourceHookContext = {
  data: Record<string, unknown>;
};

type QuestionInput = {
  question?: unknown;
  image?: unknown;
  options?: unknown;
  correctAnswers?: unknown;
};

const assertValidTimer = (timer: unknown) => {
  if (typeof timer !== "number" || !Number.isInteger(timer)) {
    throw new Error("timer must be a whole number of seconds.");
  }

  if (timer < 60) {
    throw new Error("timer must be at least 60 seconds.");
  }

  if (timer > 10800) {
    throw new Error("timer cannot exceed 10800 seconds.");
  }
};

const isValidUrl = (value: string) => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

const assertValidQuestions = (questions: unknown) => {
  if (!Array.isArray(questions) || questions.length < 1) {
    throw new Error("A quiz must include at least 1 question.");
  }

  questions.forEach((question: QuestionInput, index) => {
    if (typeof question.question !== "string" || question.question.trim() === "") {
      throw new Error(`Question ${index + 1} must include text.`);
    }

    if (
      typeof question.image !== "undefined" &&
      (typeof question.image !== "string" ||
        question.image.trim() === "" ||
        !isValidUrl(question.image))
    ) {
      throw new Error(`Question ${index + 1} must include a valid image URL when provided.`);
    }

    if (
      !Array.isArray(question.options) ||
      question.options.length !== 4 ||
      question.options.some(
        (option) => typeof option !== "string" || option.trim() === ""
      )
    ) {
      throw new Error(`Question ${index + 1} must include exactly 4 non-empty options.`);
    }

    if (
      !Array.isArray(question.correctAnswers) ||
      question.correctAnswers.length < 1 ||
      question.correctAnswers.length > 4 ||
      new Set(question.correctAnswers).size !== question.correctAnswers.length ||
      question.correctAnswers.some(
        (answer) =>
          typeof answer !== "number" ||
          !Number.isInteger(answer) ||
          answer < 0 ||
          answer > 3
      )
    ) {
      throw new Error(
        `Question ${index + 1} must include 1 to 4 unique correctAnswers from 0 to 3.`
      );
    }
  });
};

const validateQuizCreate = (ctx: ResourceHookContext) => {
  assertValidTimer(ctx.data.timer);
  assertValidQuestions(ctx.data.questions);
  return ctx.data;
};

const validateQuizUpdate = (ctx: ResourceHookContext) => {
  if ("timer" in ctx.data) {
    assertValidTimer(ctx.data.timer);
  }

  if ("questions" in ctx.data) {
    assertValidQuestions(ctx.data.questions);
  }

  return ctx.data;
};

export default defineResource<Quiz>({
  name: "quiz",
  displayName: "Quiz",
  prefix: "/quizzes",
  adapter: createMongooseAdapter({
    model: QuizModel,
    repository: quizRepository,
    schemaGenerator: buildCrudSchemasFromModel
  }),
  permissions: {
    list: allowPublic(),
    get: allowPublic(),
    create: requireAuth(),
    update: requireAuth(),
    delete: requireAuth()
  },
  schemaOptions: {
    fieldRules: {
      createdBy: {
        type: "string",
        systemManaged: true,
        description: "Clerk user ID of the quiz creator."
      },
      questionCount: {
        type: "number",
        systemManaged: true,
        description: "Number of questions in the quiz (virtual field)."
      },
      "questions.image": {
        type: "string",
        nullable: true,
        description: "Optional ImageKit URL for the question prompt."
      },
      "questions.correctAnswers": {
        type: "array",
        hidden: true,
        items: { type: "number" },
        description:
          "Indexes of the correct answers. Hidden from normal quiz reads."
      }
    },
    filterableFields: ["createdBy", "title"],
    query: {
      filterableFields: {
        createdBy: { type: "string" },
        title: { type: "string" }
      }
    }
  },
  hooks: {
    beforeCreate: validateQuizCreate,
    beforeUpdate: validateQuizUpdate
  }
});
