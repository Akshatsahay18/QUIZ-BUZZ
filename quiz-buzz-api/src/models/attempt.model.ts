import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const attemptSchema = new Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  quizId: {
    type: Schema.Types.ObjectId,
    ref: "Quiz",
    required: true,
    index: true
  },
  answers: {
    type: [Number],
    required: true,
    default: []
  },
  score: {
    type: Number,
    required: true,
    min: 0
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
});

export type Attempt = InferSchemaType<typeof attemptSchema>;

const AttemptModel: Model<Attempt> =
  mongoose.models.Attempt ?? mongoose.model<Attempt>("Attempt", attemptSchema);

export default AttemptModel;
