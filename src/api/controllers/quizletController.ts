import { Request, Response } from "express";
import Quizlet from "../../models/Quizlet";
import QuestionCard from "../../models/QuestionCard";
import User from "../../models/User";
import jwt from "jsonwebtoken";
import StudyLog from "../../models/StudyLog";

/* <-- 학습세트 생성 --> */
export const createQuizlet = async (req: Request, res: Response) => {
  const { title, tagList, description } = req.body;
  const questionCardList = req.body.questionCardList;

  try {
    // 권한 확인
    const user = (req as any).user;
    if (!user) {
      return res.status(401).send({
        isSuccess: false,
        message: "로그인된 사용자만 접근 가능",
      });
    }

    // 학습세트 생성
    const newQuizlet = await Quizlet.create({
      title,
      description,
      tagList,
      owner: user.id,
    });

    // 학습세트 생성 오류 시
    if (!newQuizlet) {
      return res.status(400).send({
        isSuccess: false,
        message: "학습세트 생성 오류",
      });
    }

    // 생성된 학습세트 호출
    const quizlet = await Quizlet.findById(newQuizlet._id);
    if (!quizlet) {
      return res.status(400).send({
        isSuccess: false,
        message: "생성된 학습세트를 찾을 수 없습니다",
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

        // 학습카드 생성 오류 시
        if (!newQuestionCard) {
          return res.status(400).send({
            isSuccess: false,
            message: "학습카드 생성 오류",
          });
        }

        return newQuestionCard._id;
      })
    );

    // 학습세트 저장
    quizlet.questionCardList = newQuestionCards;
    await quizlet.save();

    // 학습세트 생성 성공 반환
    return res.status(200).send({
      isSuccess: true,
      message: "학습세트 생성 성공",
      newQuizletId: quizlet._id,
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

/* <-- 학습세트 삭제 --> */
export const deleteQuizlet = async (req: Request, res: Response) => {
  const { quizletId } = req.params;
  const { id } = (req as any).user;

  try {
    // 삭제 대상 학습세트 호출
    const quizlet = await Quizlet.findById(quizletId);
    if (!quizlet) {
      return res.status(400).send({
        isSuccess: false,
        message: "학습세트를 찾을 수 없습니다",
      });
    }

    // 호출된 학습세트 소유자가 로그인 사용자와 다를 경우
    if (String(quizlet.owner) !== String(id)) {
      return res.status(400).send({
        isSuccess: false,
        message: "삭제 권한이 없습니다",
      });
    }

    // 학습세트가 소유한 학습카드 삭제
    const deleteQuestionCards = quizlet.questionCardList.map(
      async (questionCard) => {
        const deletedQuestionCard = await QuestionCard.deleteOne({
          _id: questionCard,
        });

        if (!deletedQuestionCard) {
          return res.status(400).send({
            isSuccess: false,
            message: "학습카드 삭제 오류",
          });
        }
      }
    );

    await Promise.all(deleteQuestionCards);

    // 학습세트 삭제
    const deletedQuizlet = await Quizlet.deleteOne({ _id: quizlet._id });

    // 학습세트 삭제시 오류가 발생할 경우
    if (!deletedQuizlet) {
      return res.status(400).send({
        isSuccess: false,
        message: "학습세트 삭제 오류",
      });
    }

    // 학습세트 삭제 성공 반환
    return res.status(200).send({
      isSuccess: true,
      message: "학습세트 삭제 성공",
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
  const { quizletId } = req.params;
  const { id } = (req as any).user;
  const {
    title,
    tagList,
    description,
    questionListToRemove,
    questionCardListToAdd,
  } = req.body;

  try {
    // 대상 학습세트 조회
    const quizlet = await Quizlet.findById(quizletId);

    // 학습세트가 조회되지 않을 경우
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
        message: "수정 권한이 없습니다",
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
        message: "학습세트 수정 오류",
      });
    }

    // 학습카드 제거
    for (const questionCardId of questionListToRemove) {
      await QuestionCard.findByIdAndDelete(questionCardId);
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
            message: "학습카드 생성 오류",
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
      message: "학습세트 수정 성공",
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

/* <-- 학습세트 정보 --> */
export const quizletInfo = async (req: Request, res: Response) => {
  const { quizletId } = req.params;

  try {
    // DB에서 학습세트 조회
    const quizlet = await Quizlet.findById(quizletId).populate(
      "questionCardList"
    );

    // 학습세트 조회가 안되는 경우
    if (!quizlet) {
      return res.status(400).send({
        isSuccess: false,
        message: "학습세트를 찾을 수 없습니다",
      });
    }

    // 학습세트 정보 반환
    const { title, description, tagList, questionCardList } = quizlet;

    return res.status(200).send({
      isSuccess: true,
      message: "학습세트 조회 성공",
      quizlet: {
        title,
        description,
        tagList,
        questionCardList,
      },
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

/* <-- 학습세트 상세 --> */
export const quizletDetail = async (req: Request, res: Response) => {
  const { quizletId } = req.params;

  // 로그인 여부 판단 (authTokenMiddleware를 거치지 않는 라우팅이기 때문에 판단)
  const accessToken = req.cookies.accessToken;
  if (accessToken) {
    jwt.verify(
      accessToken,
      process.env.ACCESS_SECRET as string,
      { complete: true },
      (error: jwt.VerifyErrors | null, decoded: any) => {
        if (!error) {
          (req as any).user = decoded.payload;
        }
      }
    );
  }

  try {
    // 학습세트 조회
    const quizlet = await Quizlet.findById(quizletId)
      .populate({
        path: "questionCardList",
        select: "question",
      })
      .populate({
        path: "owner",
        select: "name nickname email avatarUrl",
      });

    // 학습세트가 조회되지 않을 경우
    if (!quizlet) {
      return res.status(400).send({
        isSuccess: false,
        message: "학습세트를 찾을 수 없습니다",
      });
    }

    // 로그인된 사용자 여부 확인
    const user = (req as any).user;
    console.log(user);
    // 로그인 되지 않은 경우
    if (!user) {
      // 학습세트 정보 반환
      return res.status(200).send({
        isSuccess: true,
        quizlet,
      });
    } else {
      // 로그인한 경우
      // 로그인한 사용자 정보 조회
      const userInfo: any = await User.findById(user.id).populate("studyLog");

      // 사용자 정보가 조회되지 않는 경우
      if (!userInfo) {
        return res.status(400).send({
          isSuccess: false,
          message: "사용자를 찾을 수 없습니다",
        });
      }

      console.log(userInfo);

      // 사용자의 학습기록에 현재 학습세트 존재여부 확인
      const isStudyLog = userInfo.studyLog.find(
        (value: any) => value.about === quizlet._id
      );

      console.log(isStudyLog);

      // 현재 학습세트가 존재하지 않는 경우
      if (!isStudyLog) {
        return res.status(200).send({
          isSuccess: true,
          quizlet,
        });
      }

      // 존재하는 경우
      return res.status(200).send({
        isSuccess: true,
        quizlet,
        studyLog: {
          studyCount: isStudyLog.views,
          numOfQuestion: quizlet.questionCardList.length,
          numOfQuestionsToReview: isStudyLog.wrongList.length,
          lastQuizDate: isStudyLog.updateAt,
        },
      });
    }
  } catch (error) {
    console.log(`Error: ${error}`);
    return res.status(500).send({
      isSuccess: false,
      message: "예상치 못한 오류 발생",
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
        message: "태그 목록 조회 실패",
      });
    }

    // 태그목록 조회 성공 반환
    return res.status(200).send({
      isSuccess: true,
      message: "학습세트의 모든 태그목록 조회 성공",
      tagList,
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

/* <-- 나의 학습세트 태그목록 --> */
export const myTagList = async (req: Request, res: Response) => {
  const { id } = (req as any).user;

  try {
    // 로그인 여부 확인
    if (!id) {
      return res.status(401).send({
        isSuccess: false,
        message: "로그인된 사용자만 접근 가능",
      });
    }

    // 로그인한 사용자의 학습기록 조회
    const user: any = await User.findById(id).populate({
      path: "studyLog",
      populate: {
        path: "about",
        model: "Quizlet",
        select: "tagList",
      },
    });

    // 사용자가 조회되지 않는 경우
    if (!user) {
      return res.status(401).send({
        isSuccess: false,
        message: "사용자 정보를 찾을 수 없습니다",
      });
    }

    // 로그인한 사용자의 학습세트의 태그목록 추출
    const tagList = [
      ...new Set(user.studyLog.map((log: any) => log.about.tagList).flat()),
    ];

    return res.status(200).send({
      isSuccess: true,
      message: "사용자의 모든 학습세트 태그목록 조회 성공",
      tagList,
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

/* <-- 학습정보 제출 --> */
export const postStudy = async (req: Request, res: Response) => {
  try {
    const { id } = (req as any).user;
    const { quizletId } = req.params;
    const { questionListToReview, questionToCorrectList } = req.body;

    // 로그인 여부 확인
    if (!id) {
      return res.status(401).send({
        isSuccess: false,
        message: "로그인된 사용자만 접근 가능",
      });
    }

    // 로그인한 사용자 정보 확인
    const user: any = await User.findById(id).populate('studyLog');
    if(!user) {
      return res.status(400).send({
        isSuccess: false,
        message: '사용자를 찾을 수 없습니다'
      });
    }

    // 이미 학습한 기록이 있는지 조회
    const [ isStudyLog ] = user.studyLog.filter((study: any) => String(study.about) === String(quizletId));
    
    // 학습기록이 없는 경우
    if(!isStudyLog) {
      // 학습기록 저장
      const newStudyLog = await StudyLog.create({
        wrongList: questionListToReview,
        correctList: questionToCorrectList,
        about: quizletId
      });
      // 학습기록 생성 실패일 경우
      if(!newStudyLog) {
        return res.status(400).send({
          isSuccess: false,
          message: "학습기록 저장 실패",
        });
      }

      // 사용자의 studyLog에 등록
      user.studyLog.push(newStudyLog._id);
      await user.save();

      // 생성 성공 반환
      return res.status(200).send({
        isSuccess: true,
        message: '학습기록 저장 성공'
      });
    } else {
      // 기존 학습기록 업데이트
      await StudyLog.findByIdAndUpdate(isStudyLog._id, {
        wrongList: questionListToReview,
        correctList: questionToCorrectList,
        updateAt: Date.now(),
      });

      // 업데이트 성공 반환
      return res.status(200).send({
        isSuccess: true,
        message: '학습기록 업데이트 성공'
      })
    }
  } catch(error) {
    console.log(`Error: ${error}`);
    return res.status(500).send({
      isSuccess: false,
      message: "예상치 못한 오류 발생",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};