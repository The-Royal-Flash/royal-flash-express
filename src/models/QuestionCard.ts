import mongoose from "mongoose";

interface IQuestionCard {
  question: string;
  answer: string;
  link?: string;
}

const questionCardSchema = new mongoose.Schema<IQuestionCard>({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  link: String,
});

const QuestionCard = mongoose.model<IQuestionCard>(
  "QuestionCard",
  questionCardSchema
);

export default QuestionCard;
