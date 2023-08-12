import mongoose, { Types } from 'mongoose';

interface IQuizlet {
	title: string;
	description: string;
	tagList: string[];
	questionCardList: Types.ObjectId[];
	owner: Types.ObjectId;
	createAt: Date;
	updateAt: Date;
}

const quizletSchema = new mongoose.Schema<IQuizlet>({
	title: { type: String, required: true },
	description: { type: String, required: true },
	tagList: [{ type: String, required: true }],
	questionCardList: [
		{ type: mongoose.Schema.Types.ObjectId, ref: 'QuestionCard' },
	],
	owner: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
	createAt: { type: Date, default: Date.now },
	updateAt: { type: Date, default: Date.now },
});

const Quizlet = mongoose.model<IQuizlet>('Quizlet', quizletSchema);

export default Quizlet;
