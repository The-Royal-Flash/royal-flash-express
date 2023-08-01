import mongoose, { Types } from "mongoose";

export interface IStudyLog {
  wrongList: Types.ObjectId[];
  correctList: Types.ObjectId[];
  createAt: Date;
  about: Types.ObjectId;
  owner: Types.ObjectId;
}

const studyLogSchema = new mongoose.Schema<IStudyLog>({
  wrongList: [{ type: mongoose.Schema.Types.ObjectId, ref: "QuestionCard" }],
  correctList: [{ type: mongoose.Schema.Types.ObjectId, ref: "QuestionCard" }],
  createAt: { type: Date, default: Date.now },
  about: { type: mongoose.Schema.Types.ObjectId, ref: "Quizlet" },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const StudyLog = mongoose.model<IStudyLog>("StudyLog", studyLogSchema);

export default StudyLog;