import { Request, Response } from 'express';
import Quizlet from '../../models/Quizlet';
import QuestionCard from '../../models/QuestionCard';
import StudyLog from '../../models/StudyLog';
import {
	createAccessToken,
	verifyAccessToken,
	verifyRefreshToken,
} from '../../utils/jwt-util';
import RefreshToken from '../../models/RefreshToken';
import { STUDY_MODE } from '../../constants/study';
import { sendTokenHandler, unkownErrorHandler } from '../../utils/utils';

/* <-- 학습세트 생성 --> */
export const createQuizlet = async (req: Request, res: Response) => {
	try {
		const { title, tagList, description } = req.body;
		const { questionCardList } = req.body;

		// 로그인 여부 확인
		if (!(req as any).user) {
			return res.status(401).send({
				isSuccess: false,
				message: '로그인된 사용자만 접근 가능합니다',
			});
		}

		const { id } = (req as any).user;

		// 학습세트 생성
		const newQuizlet = await Quizlet.create({
			title,
			description,
			tagList,
			owner: id,
		});
		if (!newQuizlet) {
			return res.status(400).send({
				isSuccess: false,
				message: '학습세트 생성 중 오류가 발생했습니다',
			});
		}

		// 생성된 학습세트 호출
		const quizlet = await Quizlet.findById(newQuizlet._id);
		if (!quizlet) {
			return res.status(400).send({
				isSuccess: false,
				message: '학습세트를 찾을 수 없습니다',
			});
		}

		// 학습카드 생성
		const newQuestionCards = await Promise.all(
			questionCardList.map(async (questionCard: any) => {
				const newQuestionCard = await QuestionCard.create({
					question: questionCard.question,
					answer: questionCard.answer,
					link: questionCard.link,
				});
				if (!newQuestionCard) {
					return res.status(400).send({
						isSuccess: false,
						message: '학습카드 생성 중 오류가 발생했습니다',
					});
				}

				return newQuestionCard._id;
			}),
		);

		// 학습세트 저장
		quizlet.questionCardList = newQuestionCards;
		await quizlet.save();

		// 성공 여부 반환
		return res.status(200).send({
			isSuccess: true,
			message: '학습세트 생성 성공',
			newQuizletId: quizlet._id,
		});
	} catch (error) {
		unkownErrorHandler(res, error);
	}
};

/* <-- 학습세트 삭제 --> */
export const deleteQuizlet = async (req: Request, res: Response) => {
	try {
		const { quizletId } = req.params;

		// 로그인 여부 확인
		if (!(req as any).user) {
			return res.status(401).send({
				isSuccess: false,
				message: '로그인된 사용자만 접근 가능합니다',
			});
		}

		const { id } = (req as any).user;

		// 학습세트 조회
		const quizlet = await Quizlet.findById(quizletId);
		if (!quizlet) {
			return res.status(400).send({
				isSuccess: false,
				message: '학습세트를 찾을 수 없습니다',
			});
		}

		// 호출된 학습세트 소유자가 로그인 된 사용자와 다를 경우
		if (String(quizlet.owner) !== String(id)) {
			return res.status(400).send({
				isSuccess: false,
				message: '삭제할 수 있는 권한이 없습니다',
			});
		}

		// 연관된 모든 학습카드 삭제
		const deleteQuestionCards = quizlet.questionCardList.map(
			async (questionCard) => {
				const deletedQuestionCard = await QuestionCard.deleteOne({
					_id: questionCard,
				});
				if (!deletedQuestionCard) {
					return res.status(400).send({
						isSuccess: false,
						message: '학습카드 삭제 중 오류가 발생했습니다',
					});
				}
			},
		);
		await Promise.all(deleteQuestionCards);

		// 연관된 모든 학습기록 삭제
		await StudyLog.deleteMany({ about: quizlet._id });

		// 학습세트 삭제
		await Quizlet.deleteOne({ _id: quizlet._id });

		// 성공 여부 반환
		return res.status(200).send({
			isSuccess: true,
			message: '성공적으로 학습세트를 삭제했습니다',
		});
	} catch (error) {
		unkownErrorHandler(res, error);
	}
};

/* <-- 학습세트 수정 --> */
export const editQuizlet = async (req: Request, res: Response) => {
	try {
		const { quizletId } = req.params;
		const {
			title,
			tagList,
			description,
			questionListToRemove,
			questionCardListToAdd,
		} = req.body;

		// 로그인 여부 확인
		if (!(req as any).user) {
			return res.status(401).send({
				isSuccess: false,
				message: '로그인된 사용자만 접근 가능합니다',
			});
		}

		const { id } = (req as any).user;

		// 학습세트 조회
		const quizlet = await Quizlet.findById(quizletId);
		if (!quizlet) {
			return res.status(400).send({
				isSuccess: false,
				message: '학습세트를 찾을 수 없습니다',
			});
		}

		// 학습세트의 소유자가 로그인한 사용자와 다를 경우
		if (String(quizlet.owner) !== String(id)) {
			return res.status(400).send({
				isSuccess: false,
				message: '수정할 수 있는 권한이 없습니다',
			});
		}

		// 학습세트 수정 후 업데이트
		const editedQuizlet = await Quizlet.findByIdAndUpdate(
			quizlet._id,
			{
				title,
				tagList,
				description,
				updatedAt: Date.now(),
			},
			{ new: true },
		);
		if (!editedQuizlet) {
			return res.status(400).send({
				isSuccess: false,
				message: '학습세트 수정 중 오류가 발생했습니다',
			});
		}

		for (const questionCardId of questionListToRemove) {
			// 학습세트의 학습카드 제거
			editedQuizlet.questionCardList = editedQuizlet.questionCardList.filter(
				(cardId) => !questionListToRemove.includes(cardId.toString()),
			);

			// 학습기록의 학습카드 제거
			await StudyLog.updateMany(
				{
					$or: [{ wrongList: questionCardId }, { correctList: questionCardId }],
				},
				{
					$pull: {
						wrongList: questionCardId,
						correctList: questionCardId,
					},
				},
			);

			// 학습카드 제거
			await QuestionCard.findByIdAndDelete(questionCardId).exec();
		}

		// 추가 학습카드 생성
		const newQuestionCards = await Promise.all(
			questionCardListToAdd.map(async (questionCard: any) => {
				const newQuestionCard = await QuestionCard.create({
					question: questionCard.question,
					answer: questionCard.answer,
					link: questionCard.link,
				});

				// 학습카드 생성 오류 시
				if (!newQuestionCard) {
					return res.status(400).send({
						isSuccess: false,
						message: '학습카드 생성 중 오류가 발생했습니다',
					});
				}

				return newQuestionCard._id;
			}),
		);

		// 학습세트에 학습카드 추가
		editedQuizlet.questionCardList.push(...newQuestionCards);
		await editedQuizlet.save();

		// 학습세트 수정 성공 반환
		return res.status(200).send({
			isSuccess: true,
			message: '성공적으로 학습세트 정보를 수정했습니다',
		});
	} catch (error) {
		unkownErrorHandler(res, error);
	}
};

/* <-- 학습세트 정보 --> */
export const quizletInfo = async (req: Request, res: Response) => {
	try {
		const { quizletId } = req.params;

		// 학습세트 조회
		const quizlet = await Quizlet.findById(quizletId).populate(
			'questionCardList',
		);
		if (!quizlet) {
			return res.status(400).send({
				isSuccess: false,
				message: '학습세트를 찾을 수 없습니다',
			});
		}

		const { title, description, tagList, questionCardList } = quizlet;

		// 성공 여부 반환
		return res.status(200).send({
			isSuccess: true,
			message: '성공적으로 학습세트를 조회했습니다',
			title,
			description,
			tagList,
			questionCardList,
		});
	} catch (error) {
		unkownErrorHandler(res, error);
	}
};

/* <-- 학습세트 상세 --> */
export const quizletDetail = async (req: Request, res: Response) => {
	try {
		const { quizletId } = req.params;

		// 학습세트 조회
		const quizlet = await Quizlet.findById(quizletId)
			.populate({
				path: 'questionCardList',
				select: 'question',
			})
			.populate({
				path: 'owner',
				select: '_id name nickname email avatarUrl',
			});
		if (!quizlet) {
			return res.status(400).send({
				isSuccess: false,
				message: '학습세트를 찾을 수 없습니다',
			});
		}

		// 로그인 여부 판단
		const { accessToken } = req.cookies;
		const { refreshToken } = req.cookies;
		const isAccessToken = accessToken && verifyAccessToken(accessToken);
		const isRefreshToken = refreshToken && verifyRefreshToken(refreshToken);
		if (!isAccessToken) {
			if (isRefreshToken) {
				const refreshTokenData = await RefreshToken.findOne({
					token: refreshToken,
				}).select('userId');
				if (refreshTokenData) {
					const newAccessToken = createAccessToken({
						id: refreshTokenData.userId,
					});

					sendTokenHandler(res, 'accessToken', newAccessToken, false);

					(req as any).user = { id: refreshTokenData.userId };
				}
			}
		} else {
			(req as any).user = { id: isAccessToken };
		}

		// 로그인 여부 확인
		if (!(req as any).user) {
			// 비 로그인인 경우 성공 여부 반환
			return res.status(200).send({
				isSuccess: true,
				message: '성공적으로 학습세트 상세정보를 조회했습니다',
				title: quizlet.title,
				tagList: quizlet.tagList,
				description: quizlet.description,
				questionList: quizlet.questionCardList,
				owner: quizlet.owner,
			});
		}
		const { id } = (req as any).user;

		// 로그인한 사용자의 학습기록 조회
		const studyLog = await StudyLog.findOne({
			owner: id,
			about: quizletId,
		});
		if (!studyLog) {
			return res.status(200).send({
				isSuccess: true,
				message: '성공적으로 학습세트 상세정보를 조회했습니다',
				title: quizlet.title,
				tagList: quizlet.tagList,
				description: quizlet.description,
				questionList: quizlet.questionCardList,
				owner: quizlet.owner,
			});
		}

		// 로그인인 경우 성공 여부 반환
		return res.status(200).send({
			isSuccess: true,
			message: '성공적으로 학습세트 상세정보를 조회했습니다',
			title: quizlet.title,
			tagList: quizlet.tagList,
			description: quizlet.description,
			questionList: quizlet.questionCardList,
			owner: quizlet.owner,
			studyLog: {
				studyCount: studyLog.views,
				numOfQuestionList: quizlet.questionCardList.length,
				numOfQuestionListToReview: studyLog.wrongList.length,
				numOfQuestionListToCorrect: studyLog.correctList.length,
				lastQuizDate: studyLog.updateAt,
			},
		});
	} catch (error) {
		unkownErrorHandler(res, error);
	}
};

/* <-- 학습정보 제출 --> */
export const postStudy = async (req: Request, res: Response) => {
	try {
		const { quizletId } = req.params;
		const { questionListToReview, questionListToCorrect, mode } = req.body;

		// 로그인 여부 확인
		if (!(req as any).user) {
			return res.status(401).send({
				isSuccess: false,
				message: '로그인된 사용자만 접근 가능합니다',
			});
		}

		const { id } = (req as any).user;

		// 학습세트 존재 여부 확인
		const quizlet = await Quizlet.findById(quizletId);
		if (!quizlet) {
			return res.status(400).send({
				isSuccess: false,
				message: '학습세트를 찾을 수 없습니다',
			});
		}

		// 이전 학습기록 존재 여부 확인
		const studyLog = await StudyLog.findOne({
			owner: id,
			about: quizletId,
		});

		if (mode === STUDY_MODE.ALL) {
			// STUDY.MODE.ALL 인 경우
			if (!studyLog) {
				// 처음 학습하는 경우
				const newStudyLog = await StudyLog.create({
					wrongList: questionListToReview,
					correctList: questionListToCorrect,
					about: quizletId,
					owner: id,
				});
				if (!newStudyLog) {
					return res.status(400).send({
						isSuccess: false,
						message: '학습기록 생성 중 오류가 발생했습니다',
					});
				}
			} else {
				// 학습기록이 존재하는 경우
				const updatedStudyLog = await StudyLog.findOneAndUpdate(
					{
						owner: id,
						about: quizletId,
					},
					{
						wrongList: questionListToReview,
						correctList: questionListToCorrect,
						updateAt: Date.now(),
						views: studyLog.views + 1,
					},
				);
				if (!updatedStudyLog) {
					return res.status(400).send({
						isSuccess: false,
						message: '학습기록 갱신 중 오류가 발생했습니다',
					});
				}
			}
		} else {
			// STUDY.MODE.WRONG 인 경우
			if (!studyLog) {
				return res.status(400).send({
					isSuccess: false,
					message: '이전 학습기록이 존재하지 않습니다',
				});
			}

			const updatedStudyLog = await StudyLog.findOneAndUpdate(
				{
					owner: id,
					about: quizletId,
				},
				{
					wrongList: questionListToReview,
					correctList: [...studyLog.correctList, ...questionListToCorrect],
					updateAt: Date.now(),
					views: studyLog.views + 1,
				},
			);
			if (!updatedStudyLog) {
				return res.status(400).send({
					isSuccess: false,
					message: '학습기록 갱신 중 오류가 발생했습니다',
				});
			}
		}

		// 성공 여부 반환
		return res.status(200).send({
			isSuccess: true,
			message: '성공적으로 학습기록을 생성했습니다',
		});
	} catch (error) {
		unkownErrorHandler(res, error);
	}
};

/* <-- 학습세트 문제 --> */
export const getStudy = async (req: Request, res: Response) => {
	try {
		const { quizletId, mode } = req.params;

		// 로그인 여부 확인
		if (!(req as any).user) {
			return res.status(401).send({
				isSuccess: false,
				message: '로그인한 사용자만 접근 가능합니다',
			});
		}

		const { id } = (req as any).user;

		// 학습세트 조회
		const quizlet = await Quizlet.findById(quizletId).populate(
			'questionCardList',
		);
		if (!quizlet) {
			return res.status(400).send({
				isSuccess: false,
				message: '학습세트를 찾을 수 없습니다',
			});
		}

		if (mode === STUDY_MODE.ALL) {
			// 문제정보 조회 성공 여부 반환(전체)
			return res.status(200).send({
				isSuccess: true,
				message: '성공적으로 학습세트 문제정보(전체)를 조회했습니다',
				title: quizlet.title,
				questionCardList: quizlet.questionCardList,
			});
		}

		if (mode === STUDY_MODE.WRONG) {
			// 학습기록 조회
			const studyLog = await StudyLog.findOne({
				owner: id,
				about: quizletId,
			}).populate('wrongList');
			if (!studyLog) {
				return res.status(404).send({
					isSuccess: false,
					message: '학습기록(오답)을 찾을 수 없습니다',
					title: quizlet.title,
					questionCardList: [],
				});
			}

			// 학습기록 중 오답목록이 없는 경우
			if (studyLog.wrongList.length === 0) {
				return res.status(200).send({
					isSuccess: true,
					message: '학습기록에 오답목록이 비어있습니다',
					title: quizlet.title,
					questionCardList: [],
				});
			}

			// 문제정보 조회 성공 여부 반환(오답)
			return res.status(200).send({
				isSuccess: true,
				message: '성공적으로 학습세트 문제정보(오답)를 조회했습니다',
				title: quizlet.title,
				questionCardList: studyLog.wrongList,
			});
		}
	} catch (error) {
		unkownErrorHandler(res, error);
	}
};
