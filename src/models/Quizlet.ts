import mongoose, { Types } from "mongoose";

interface IQuizlet {
  title: string;
  description: string;
  tagList?: string[];
  questionCardList?: Types.ObjectId[];
  owner: Types.ObjectId;
  createAt: Date;
  updateAt: Date;
}

const quizletSchema = new mongoose.Schema<IQuizlet>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  tagList: [{ type: String, default: "" }],
  questionCardList: [
    { type: mongoose.Schema.Types.ObjectId, ref: "QuestionCard" },
  ],
  owner: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
});

const Quizlet = mongoose.model<IQuizlet>("Quizlet", quizletSchema);

export default Quizlet;
