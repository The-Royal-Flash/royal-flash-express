import { Request, Response } from 'express';
import Quizlet from '../../models/Quizlet';
import StudyLog from '../../models/StudyLog';
import { unkownErrorHandler } from '../../utils/utils';

/* <-- 모든 학습세트 태그목록 --> */
export const allTagList = async (req: Request, res: Response) => {
	try {
		// 모든 학습세트의 태그목록을 조회
		const tagList = await Quizlet.distinct('tagList');

		// 태그목록이 조회되지 않는 경우
		if (!tagList) {
			return res.status(400).send({
				isSuccess: false,
				message: '모든 학습세트의 태그 목록 조회에 실패하였습니다',
			});
		}

		// 태그목록 조회 성공 반환
		return res.status(200).send({
			isSuccess: true,
			message: '성공적으로 학습세트의 모든 태그목록을 조회할 수 없습니다',
			tagList,
		});
	} catch (error) {
		unkownErrorHandler(res, error);
	}
};

/* <-- 학습한 학습세트 태그목록 --> */
export const studiedTagList = async (req: Request, res: Response) => {
	try {
		// 로그인 여부 확인
		if (!(req as any).user) {
			return res.status(401).send({
				isSuccess: false,
				message: '로그인된 사용자만 접근 가능합니다',
			});
		}

		const { id } = (req as any).user;

		// 사용자의 모든 학습기록 조회
		const studyLogs = await StudyLog.find({ owner: id })
			.populate('about')
			.exec();

		// 학습기록들의 about 필드에 있는 학습세트의 _id를 배열로 추출
		const quizletIds = studyLogs.map((studyLog) => studyLog.about);

		// 학습세트의 _id를 이용하여 해당 학습세트들을 조회
		const quizlets = await Quizlet.find({
			_id: { $in: quizletIds },
		}).exec();

		// 조회된 학습세트들의 태그목록을 반환
		const allTags: string[] = [];
		quizlets.forEach((quizlet) => {
			allTags.push(...quizlet.tagList);
		});

		// 반환된 태그목록 중복제거
		const uniqueTags = Array.from(new Set(allTags));

		// 성공 여부 반환
		return res.status(200).send({
			isSuccess: true,
			message:
				'성공적으로 사용자가 학습한 학습세트의 태그목록을 조회하였습니다',
			uniqueTags,
		});
	} catch (error) {
		unkownErrorHandler(res, error);
	}
};

/* <-- 생성한 학습세트 태그목록 --> */
export const ownedTagList = async (req: Request, res: Response) => {
	try {
		// 로그인 여부 확인
		if (!(req as any).user) {
			return res.status(401).send({
				isSuccess: false,
				message: '로그인된 사용자만 접근 가능합니다',
			});
		}

		const { id } = (req as any).user;

		// 생성한 학습세트 조회
		const quizlets = await Quizlet.find({
			owner: id,
		}).exec();

		// 조회된 학습세트들의 태그목록을 반환
		const allTags: string[] = [];
		quizlets.forEach((quizlet) => {
			allTags.push(...quizlet.tagList);
		});

		// 반환된 태그목록 중복제거
		const uniqueTags = Array.from(new Set(allTags));

		// 성공 여부 반환
		return res.status(200).send({
			isSuccess: true,
			message: '성공적으로 사용자가 생성한 학습세트의 태그목록을 조회했습니다',
			tagList: uniqueTags,
		});
	} catch (error) {
		unkownErrorHandler(res, error);
	}
};
