import { Request, Response } from 'express';
import Quizlet from '../../models/Quizlet';
import StudyLog, { IStudyLog } from '../../models/StudyLog';
import { STUDY_MODE } from '../../constants/study';

/* <-- 전체 학습세트 검색 --> */
export const getSearch = async (req: Request, res: Response) => {
	try {
		const { keyword, tagList, page, pageSize } = req.query;
		const tagListArray = tagList
			? (tagList as string).split(',').map((tag) => tag.trim())
			: [];

		// 학습세트들을 조회
		const query: any = {
			$or: [
				{ title: { $regex: keyword, $options: 'i' } },
				{ description: { $regex: keyword, $options: 'i' } },
			],
		};

		if (tagListArray.length > 0) {
			query.tagList = { $in: tagListArray };
		}

		const quizletList = await Quizlet.find(query)
			.populate('owner', 'nickname avatarUrl')
			.select('title description tagList questionCardList owner')
			.skip((Number(page) - 1) * Number(pageSize))
			.limit(Number(pageSize))
			.lean();

		// 총 페이지 계산
		const totalCount: number = await Quizlet.find({
			$or: [
				{ title: { $regex: keyword, $options: 'i' } },
				{ description: { $regex: keyword, $options: 'i' } },
				{ tagList: { $in: tagListArray } },
			],
			tagList: { $in: tagListArray },
		}).countDocuments();
		const totalPage: number = Math.ceil(totalCount / Number(pageSize));

		return res.status(200).json({
			isSuccess: true,
			page,
			totalPage,
			quizletList,
		});
	} catch (error) {
		console.log(`Error: ${error}`);
		return res.status(500).send({
			isSuccess: false,
			message: '예상치 못한 오류 발생',
			error: error instanceof Error ? error.message : String(error),
		});
	}
};

/* <-- 학습기록이 있는 학습세트 검색 --> */
export const getMyQuizletSearch = async (req: Request, res: Response) => {
	try {
		const { keyword, tagList, page, pageSize, order } = req.query;
		const tagListArray = tagList
			? (tagList as string).split(',').map((tag) => tag.trim())
			: [];

		// 로그인 여부 확인
		if (!(req as any).user) {
			return res.status(401).send({
				isSuccess: false,
				message: '로그인된 사용자만 접근 가능합니다',
			});
		}

		const { id } = (req as any).user;

		// 사용자의 학습기록 조회
		const userStudyLogs = await StudyLog.find({
			owner: id,
			mode: STUDY_MODE.ALL,
		});

		// 학습세트들의 ObjectId를 추출 (중복 제거)
		const quizletIds = [
			...new Set(
				userStudyLogs.map((studyLog: IStudyLog) => String(studyLog.about)),
			),
		];

		// 학습세트 조회
		const query: any = {
			_id: { $in: quizletIds },
			$or: [
				{ title: { $regex: keyword, $options: 'i' } },
				{ description: { $regex: keyword, $options: 'i' } },
			],
		};

		if (tagListArray.length > 0) {
			query.tagList = { $in: tagListArray };
		}

		const quizletList = await Quizlet.find(query)
			.populate('questionCardList')
			.populate('owner');

		// 학습세트와 연관된 최근 학습기록 조회
		const quizletWithStudyLog = quizletList.map((quizlet: any) => {
			const latestStudyLog = userStudyLogs.find(
				(studyLog: any) =>
					String(studyLog.about) === String(quizlet._id) &&
					studyLog.mode === STUDY_MODE.ALL,
			);
			const totalStudyLog = userStudyLogs.filter(
				(studyLog: any) => String(studyLog.about) === String(quizlet._id),
			);
			return {
				...quizlet.toObject(),
				studyLog: {
					studyCount: totalStudyLog?.length,
					createAt: latestStudyLog?.createAt || null,
					numOfQuestionListToReview: latestStudyLog?.wrongList?.length || 0,
				},
			};
		});

		// 점수 높은/낮은 순으로 quizletWithStudyLog 정렬
		if (order === 'ascending') {
			quizletWithStudyLog.sort((a, b) => {
				const { studyLog: studyLogA, questionCardList: questionListA } = a;
				const scoreA =
					studyLogA.numOfQuestionListToReview / questionListA.length;

				const { studyLog: studyLogB, questionCardList: questionListB } = b;
				const scoreB =
					studyLogB.numOfQuestionListToReview / questionListB.length;

				if (!scoreA || !scoreB) return !scoreA ? -1 : 1;
				return scoreA - scoreB ? 1 : -1;
			});
		} else {
			quizletWithStudyLog.sort((a, b) => {
				const { studyLog: studyLogA, questionCardList: questionListA } = a;
				const scoreA =
					studyLogA.numOfQuestionListToReview / questionListA.length;

				const { studyLog: studyLogB, questionCardList: questionListB } = b;
				const scoreB =
					studyLogB.numOfQuestionListToReview / questionListB.length;

				if (!scoreA || !scoreB) return !scoreA ? 1 : -1;
				return scoreA - scoreB ? -1 : 1;
			});
		}

		// 페이지네이션 처리
		const totalCount = quizletWithStudyLog.length;
		const totalPage = Math.ceil(totalCount / Number(pageSize));
		const pagedQuizletList = quizletWithStudyLog.slice(
			(Number(page) - 1) * Number(pageSize),
			Number(page) * Number(pageSize),
		);

		return res.status(200).send({
			isSuccess: true,
			page,
			totalPage,
			quizletList: pagedQuizletList,
		});
	} catch (error) {
		console.log(`Error: ${error}`);
		return res.status(500).send({
			isSuccess: false,
			message: '예상치 못한 오류 발생',
			error: error instanceof Error ? error.message : String(error),
		});
	}
};

/* <-- 생성한 학습세트 검색 --> */
export const getOwnedQuizlet = async (req: Request, res: Response) => {
	try {
		const { keyword, tagList, page, pageSize, order } = req.query;
		const tagListArray = tagList
			? (tagList as string).split(',').map((tag) => tag.trim())
			: [];

		// 로그인 여부 확인
		if (!(req as any).user) {
			return res.status(401).send({
				isSuccess: false,
				message: '로그인된 사용자만 접근 가능합니다',
			});
		}

		const { id } = (req as any).user;

		const query: any = {
			owner: id,
			$or: [
				{ title: { $regex: keyword, $options: 'i' } },
				{ description: { $regex: keyword, $options: 'i' } },
			],
		};

		if (tagListArray.length > 0) {
			query.tagList = { $in: tagListArray };
		}

		const userQuizlets = await Quizlet.find(query)
			.populate('questionCardList')
			.sort({ createAt: order === 'ascending' ? 1 : -1 });
		const userStudyLogs = await StudyLog.find({
			owner: id,
			mode: STUDY_MODE.ALL,
		}).sort({ createAt: -1 });

		// 학습세트와 연관된 최근 학습기록 조회
		const quizletWithStudyLog = userQuizlets.map((quizlet: any) => {
			const latestStudyLog = userStudyLogs.find(
				(studyLog: any) =>
					String(studyLog.about) === String(quizlet._id) &&
					studyLog.mode === STUDY_MODE.ALL,
			);

			return {
				...quizlet.toObject(),
				studyLog: {
					createAt: latestStudyLog?.createAt,
					numOfQuestionListToReview: latestStudyLog?.wrongList,
				},
			};
		});

		// 페이지네이션 처리
		const totalCount = quizletWithStudyLog.length;
		const totalPage = Math.ceil(totalCount / Number(pageSize));
		const pagedQuizletList = quizletWithStudyLog.slice(
			(Number(page) - 1) * Number(pageSize),
			Number(page) * Number(pageSize),
		);

		return res.status(200).send({
			isSuccess: true,
			page,
			totalPage,
			quizletList: pagedQuizletList,
		});
	} catch (error) {
		console.log(`Error: ${error}`);
		return res.status(500).send({
			isSuccess: false,
			message: '예상치 못한 오류 발생',
			error: error instanceof Error ? error.message : String(error),
		});
	}
};
