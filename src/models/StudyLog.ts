import mongoose, { Types } from 'mongoose';

export interface IStudyLog {
	wrongList: Types.ObjectId[];
	correctList: Types.ObjectId[];
	createAt: Date;
	updateAt: Date;
	about: Types.ObjectId;
	owner: Types.ObjectId;
	views: number;
}

const studyLogSchema = new mongoose.Schema<IStudyLog>({
	wrongList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'QuestionCard' }],
	correctList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'QuestionCard' }],
	createAt: { type: Date, default: Date.now },
	updateAt: { type: Date, default: Date.now },
	about: { type: mongoose.Schema.Types.ObjectId, ref: 'Quizlet' },
	owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	views: { type: Number, default: 1 },
});

const StudyLog = mongoose.model<IStudyLog>('StudyLog', studyLogSchema);

export default StudyLog;
