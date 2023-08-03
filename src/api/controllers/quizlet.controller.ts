import { Request, Response } from "express";
import Quizlet from "../../models/Quizlet";
import QuestionCard from "../../models/QuestionCard";
import StudyLog from "../../models/StudyLog";
import { createAccessToken, verifyAccessToken } from "../../utils/jwt-util";
import RefreshToken from "../../models/RefreshToken";

/* <-- 학습세트 생성 --> */
export const createQuizlet = async (req: Request, res: Response) => {
  try {
    const { title, tagList, description } = req.body;
    const questionCardList = req.body.questionCardList;

    // 로그인 여부 확인
    if (!(req as any).user) {
      return res.status(401).send({
        isSuccess: false,
        message: "로그인된 사용자만 접근 가능합니다",
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
        message: "학습세트 생성 중 오류가 발생했습니다",
      });
    }

    // 생성된 학습세트 호출
    const quizlet = await Quizlet.findById(newQuizlet._id);
    if (!quizlet) {
      return res.status(400).send({
        isSuccess: false,
        message: "학습세트를 찾을 수 없습니다",
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
            message: "학습카드 생성 중 오류가 발생했습니다",
          });
        }

        return newQuestionCard._id;
      })
    );

    // 학습세트 저장
    quizlet.questionCardList = newQuestionCards;
    await quizlet.save();

    /** 간이 학습기록 생성 **/
    await StudyLog.create({
      wrongList: [],
      correctList: [],
      about: quizlet._id,
      owner: id,
      mode: '전체'
    });

    // 성공 여부 반환
    return res.status(200).send({
      isSuccess: true,
      message: "학습세트 생성 성공",
      newQuizletId: quizlet._id,
    });
  } catch (error) {
    console.log(`Error: ${error}`);
    return res.status(500).send({
      isSuccess: false,
      message: "예상치 못한 오류가 발생했습니다",
      error: error instanceof Error ? error.message : String(error),
    });
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
        message: "로그인된 사용자만 접근 가능합니다",
      });
    }

    const { id } = (req as any).user;

    // 학습세트 조회
    const quizlet = await Quizlet.findById(quizletId);
    if (!quizlet) {
      return res.status(400).send({
        isSuccess: false,
        message: "학습세트를 찾을 수 없습니다",
      });
    }

    // 호출된 학습세트 소유자가 로그인 된 사용자와 다를 경우
    if (String(quizlet.owner) !== String(id)) {
      return res.status(400).send({
        isSuccess: false,
        message: "삭제할 수 있는 권한이 없습니다",
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
            message: "학습카드 삭제 중 오류가 발생했습니다",
          });
        }
      }
    );
    await Promise.all(deleteQuestionCards);

    // 연관된 모든 학습기록 삭제
    await StudyLog.deleteMany({ about: quizlet._id });

    // 학습세트 삭제
    await Quizlet.deleteOne({ _id: quizlet._id });

    // 성공 여부 반환
    return res.status(200).send({
      isSuccess: true,
      message: "성공적으로 학습세트를 삭제했습니다",
    });
  } catch (error) {
    console.log(`Error: ${error}`);
    return res.status(500).send({
      isSuccess: false,
      message: "예상치 못한 오류 발생",
      error: error instanceof Error ? error.message : String(error),
    });
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
        message: "로그인된 사용자만 접근 가능합니다",
      });
    }

    const { id } = (req as any).user;
    
    // 학습세트 조회
    const quizlet = await Quizlet.findById(quizletId);
    if (!quizlet) {
      return res.status(400).send({
        isSuccess: false,
        message: "학습세트를 찾을 수 없습니다",
      });
    }

    // 학습세트의 소유자가 로그인한 사용자와 다를 경우
    if (String(quizlet.owner) !== String(id)) {
      return res.status(400).send({
        isSuccess: false,
        message: "수정할 수 있는 권한이 없습니다",
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
      { new: true }
    );
    if (!editedQuizlet) {
      return res.status(400).send({
        isSuccess: false,
        message: "학습세트 수정 중 오류가 발생했습니다",
      });
    }

    
    for (const questionCardId of questionListToRemove) {
      // 학습세트의 학습카드 제거
      editedQuizlet.questionCardList = editedQuizlet.questionCardList.filter(
        (cardId) => !questionListToRemove.includes(cardId.toString())
      );

      // 학습기록의 학습카드 제거
      await StudyLog.updateMany(
        {
          $or: [
            { wrongList: questionCardId },
            { correctList: questionCardId },
          ],
        },
        {
          $pull: {
            wrongList: questionCardId,
            correctList: questionCardId,
          },
        }
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
            message: "학습카드 생성 중 오류가 발생했습니다",
          });
        }

        return newQuestionCard._id;
      })
    );

    // 학습세트에 학습카드 추가
    editedQuizlet.questionCardList.push(...newQuestionCards);
    await editedQuizlet.save();

    // 학습세트 수정 성공 반환
    return res.status(200).send({
      isSuccess: true,
      message: "성공적으로 학습세트 정보를 수정했습니다",
    });
  } catch (error) {
    console.log(`Error: ${error}`);
    return res.status(500).send({
      isSuccess: false,
      message: "예상치 못한 오류가 발생했습니다",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/* <-- 학습세트 정보 --> */
export const quizletInfo = async (req: Request, res: Response) => {
  try {
    const { quizletId } = req.params;

    // 학습세트 조회
    const quizlet = await Quizlet.findById(quizletId).populate(
      "questionCardList"
    );
    if (!quizlet) {
      return res.status(400).send({
        isSuccess: false,
        message: "학습세트를 찾을 수 없습니다",
      });
    }

    const { title, description, tagList, questionCardList } = quizlet;

    // 성공 여부 반환
    return res.status(200).send({
      isSuccess: true,
      message: "성공적으로 학습세트를 조회했습니다",
      title,
      description,
      tagList,
      questionCardList,
    });
  } catch (error) {
    console.log(`Error: ${error}`);
    return res.status(500).send({
      isSuccess: false,
      message: "예상치 못한 오류가 발생했습니다",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/* <-- 학습세트 상세 --> */
export const quizletDetail = async (req: Request, res: Response) => {
  try {
    const { quizletId } = req.params;

    // 학습세트 조회
    const quizlet = await Quizlet.findById(quizletId).populate({
      path: 'questionCardList',
      select: 'question'
    }).populate({
      path: 'owner',
      select: 'name nickname email avatarUrl'
    });
    if(!quizlet) {
      return res.status(400).send({
        isSuccess: false,
        message: '학습세트를 찾을 수 없습니다'
      });
    }

    // 로그인 여부 판단
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;
    const isAccessToken = verifyAccessToken(accessToken);
    const isRefreshToken = verifyAccessToken(refreshToken);
    if(!isAccessToken) {
      if(isRefreshToken) {
        const refreshTokenData = await RefreshToken.findOne({token: refreshToken}).select('userId');
        if(refreshTokenData) {
          const newAccessToken = createAccessToken({id: refreshTokenData.userId});

          res.cookie("accessToken", newAccessToken, {
            secure: false, // http: false, https: true
            httpOnly: true,
          });
          (req as any).user = { id: refreshTokenData.userId };
        }
      }
    } else {
      (req as any).user = { id: isAccessToken };
    }

    // 로그인 여부 확인
    if(!(req as any).user) {
      // 비 로그인인 경우 성공 여부 반환
      return res.status(200).send({
        isSuccess: true,
        message: '성공적으로 학습세트 상세정보를 조회했습니다',
        title: quizlet.title,
        tagList: quizlet.tagList,
        description: quizlet.description,
        questionList: quizlet.questionCardList,
        owner: quizlet.owner
      });
    } else {
      const { id } = (req as any).user;

      // 로그인한 사용자의 학습기록 조회
      const studyLog = await StudyLog.find({ owner: id, about: quizletId })
      .sort({ createAt: -1 })
      .exec();

      // 로그인인 경우 성공 여부 반환
      return res.status(200).send({
        isSuccess: true,
        message: '성공적으로 학습세트 상세정보를 조회했습니다',
        title: quizlet.title,
        tagList: quizlet.tagList,
        description: quizlet.description,
        questionList: quizlet.questionCardList,
        owner: quizlet.owner,
        studyCount: studyLog.length,
        numOfQuestionList: quizlet.questionCardList.length,
        numOfQuestionListToReview: studyLog[0].wrongList.length,
        numOfQuestionListToCorrect: studyLog[0].correctList.length,
        lastQuizDate: studyLog[0].createAt
      });
    }
  } catch (error) {
    console.log(`Error: ${error}`);
    return res.status(500).send({
      isSuccess: false,
      message: "예상치 못한 오류가 발생했습니다",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/* <-- 모든 학습세트 태그목록 --> */
export const allTagList = async (req: Request, res: Response) => {
  try {
    // 모든 학습세트의 태그목록을 조회
    const tagList = await Quizlet.distinct("tagList");

    // 태그목록이 조회되지 않는 경우
    if (!tagList) {
      return res.status(400).send({
        isSuccess: false,
        message: "모든 학습세트의 태그 목록 조회에 실패하였습니다",
      });
    }

    // 태그목록 조회 성공 반환
    return res.status(200).send({
      isSuccess: true,
      message: "성공적으로 학습세트의 모든 태그목록을 조회할 수 없습니다",
      tagList,
    });
  } catch (error) {
    console.log(`Error: ${error}`);
    return res.status(500).send({
      isSuccess: false,
      message: "예상치 못한 오류가 발생했습니다",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/* <-- 나의 학습세트 태그목록 --> */
export const myTagList = async (req: Request, res: Response) => {
  try {
    // 로그인 여부 확인
    if (!(req as any).user) {
      return res.status(401).send({
        isSuccess: false,
        message: "로그인된 사용자만 접근 가능합니다",
      });
    }

    const { id } = (req as any).user;

    // 사용자의 모든 학습기록 조회
    const studyLogs = await StudyLog.find({ owner: id }).populate('about').exec();

    // 학습기록들의 about 필드에 있는 학습세트의 _id를 배열로 추출
    const quizletIds = studyLogs.map((studyLog) => studyLog.about);

    // 학습세트의 _id를 이용하여 해당 학습세트들을 조회
    const quizlets = await Quizlet.find({
      _id: { $in: quizletIds }
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
      message: '성공적으로 사용자가 학습한 학습세트의 태그목록을 조회하였습니다',
      uniqueTags
    });
  } catch (error) {
    console.log(`Error: ${error}`);
    return res.status(500).send({
      isSuccess: false,
      message: "예상치 못한 오류가 발생했습니다",
      error: error instanceof Error ? error.message : String(error),
    });
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
        message: "로그인된 사용자만 접근 가능합니다",
      });
    }

    const { id } = (req as any).user;

    // 학습세트 존재 여부 확인
    const isQuizlet = await Quizlet.exists({_id: quizletId});
    if(!isQuizlet) {
      return res.status(400).send({
        isSuccess: false,
        message: "학습세트를 찾을 수 없습니다"
      });
    }

    // 학습기록 생성
    const studyLog = await StudyLog.create({
      wrongList: questionListToReview,
      correctList: questionListToCorrect,
      about: quizletId,
      owner: id,
      mode
    });
    if(!studyLog) {
      return res.status(400).send({
        isSuccess: false,
        message: '학습기록 생성 중 오류가 발생했습니다',
      });
    }

    // 성공 여부 반환
    return res.status(200).send({
      isSuccess: true,
      message: '성공적으로 학습기록을 생성했습니다'
    });
  } catch (error) {
    console.log(`Error: ${error}`);
    return res.status(500).send({
      isSuccess: false,
      message: "예상치 못한 오류가 발생했습니다",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/* <-- 학습세트 문제 --> */
export const getStudy = async (req: Request, res: Response) => {
  try {
    const { mode } = req.body;
    const { quizletId } = req.params;

    // 로그인 여부 확인
    if(!(req as any).user) {
      return res.status(401).send({
        isSuccess: false,
        message: '로그인한 사용자만 접근 가능합니다'
      });
    }

    const { id } = (req as any).user;

    // 학습세트 조회
    const quizlet = await Quizlet.findById(quizletId).populate('questionCardList');
    if(!quizlet) {
      return res.status(400).send({
        isSuccess: false,
        message: '학습세트를 찾을 수 없습니다'
      });
    }

    if(mode === '전체') {
      // 문제정보 조회 성공 여부 반환(전체)
      return res.status(200).send({
        isSuccess: true,
        message: '성공적으로 학습세트 문제정보(전체)를 조회했습니다',
        title: quizlet.title,
        questionCardList: quizlet.questionCardList,
      });
    } else if(mode === '오답') {
      // 학습기록 조회
      const studyLog = await StudyLog.find({ owner: id, about: quizletId })
      .populate('wrongList')
      .sort({ createAt: -1 })
      .exec();
      
      // 오답 기록이 없는 경우
      if(studyLog.length === 0 || studyLog[0].wrongList.length === 0) {
        return res.status(200).send({
          isSuccess: true,
          message: '학습기록에서 오답목록이 없습니다',
          title: quizlet.title,
          questionCardList: []
        });
      }

      // 문제정보 조회 성공 여부 반환(오답)
      return res.status(200).send({
        isSuccess: true,
        message: '성공적으로 학습세트 문제정보(오답)를 조회했습니다',
        title: quizlet.title,
        questionCardList: studyLog[0].wrongList
      });
    } else {
      // 유요하지 않은 모드 값인 경우
      return res.status(400).send({
        isSuccess: false,
        message: '유요하지 않은 모드 값 입니다'
      });
    }
  } catch(error) {
    console.log(`Error: ${error}`);
    return res.status(500).send({
      isSuccess: false,
      message: "예상치 못한 오류가 발생했습니다",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};