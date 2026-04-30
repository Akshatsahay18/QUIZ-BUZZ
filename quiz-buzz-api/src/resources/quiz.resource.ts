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
  options?: unknown;
  correctAnswer?: unknown;
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
      !Array.isArray(question.options) ||
      question.options.length !== 4 ||
      question.options.some((option) => typeof option !== "string")
    ) {
      throw new Error(`Question ${index + 1} must include exactly 4 options.`);
    }

    if (
      typeof question.correctAnswer !== "number" ||
      !Number.isInteger(question.correctAnswer) ||
      question.correctAnswer < 0 ||
      question.correctAnswer > 3
    ) {
      throw new Error(`Question ${index + 1} must include a correctAnswer from 0 to 3.`);
    }
  });
};

const validateQuizCreate = (ctx: ResourceHookContext) => {
  assertValidQuestions(ctx.data.questions);
  return ctx.data;
};

const validateQuizUpdate = (ctx: ResourceHookContext) => {
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
      "questions.correctAnswer": {
        type: "number",
        hidden: true,
        min: 0,
        max: 3,
        description: "Index of the correct answer. Hidden from normal quiz reads."
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
