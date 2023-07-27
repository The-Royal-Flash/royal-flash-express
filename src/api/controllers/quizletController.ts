import { Request, Response } from "express";
import Quizlet from "../../models/Quizlet";
import QuestionCard from "../../models/QuestionCard";
import User from "../../models/User";
import jwt from "jsonwebtoken";
import StudyLog from "../../models/StudyLog";

/* <-- 학습세트 생성 --> */
export const createQuizlet = async (req: Request, res: Response) => {
  try {
    const { title, tagList, description } = req.body;
    const questionCardList = req.body.questionCardList;
    const { id } = (req as any).user;

    // 로그인 여부 확인
    if (!id) {
      return res.status(401).send({
        isSuccess: false,
        message: "로그인된 사용자만 접근 가능합니다",
      });
    }

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

  try {
    const { quizletId } = req.params;
    const { id } = (req as any).user;

    // 삭제 대상 학습세트 조회
    const quizlet = await Quizlet.findById(quizletId);
    if (!quizlet) {
      return res.status(404).send({
        isSuccess: false,
        message: "학습세트를 찾을 수 없습니다",
      });
    }

    // 호출된 학습세트 소유자가 로그인 사용자와 다를 경우
    if (String(quizlet.owner) !== String(id)) {
      return res.status(400).send({
        isSuccess: false,
        message: "삭제할 수 있는 권한이 없습니다",
      });
    }

    // 학습세트가 소유한 학습카드 삭제
    await QuestionCard.deleteMany({ _id: { $in: quizlet.questionCardList } });

    // 연관된 학습기록들의 _id 조회
    const associatedStudyLogs = await StudyLog.find({ about: quizletId }, '_id');

    // 연관된 학습기록 삭제
    for(const studyLogId of associatedStudyLogs) {
      try {
        const studyLog = await StudyLog.findById(studyLogId);
        if(!studyLog) {
          return res.status(400).send({
            isSuccess: false,
            message: '연관된 학습기록을 찾을 수 없습니다'
          });
        }

        // 연관된 학습기록을 갖고 있는 모든 사용자 조회
        const usersWithStudyLog = await User.find({ studyLog: { $in: associatedStudyLogs.map(studyLog => studyLog.about) } });
        console.log(usersWithStudyLog);

        // 각 사용자의 학습기록 필드에서 학습기록 삭제
        for(const user of usersWithStudyLog) {
          const newStudyLog = user.studyLog.filter((studyLogId) => !associatedStudyLogs.some(studyLog => String(studyLog.about) === String(studyLogId)));
          user.studyLog = newStudyLog;
          await user.save();
        }

        // 학습기록 삭제
        await StudyLog.deleteOne({_id: studyLogId});

      } catch(error) {
        return res.status(400).send({
          isSuccess: false,
          message: '오류가 발생하여 해당 학습세트와 연관된 정보를 삭제하지 못했습니다'
        });
      }
    }

    // 학습세트 삭제
    const deletedQuizlet = await Quizlet.deleteOne({ _id: quizlet._id });
    if (!deletedQuizlet) {
      return res.status(400).send({
        isSuccess: false,
        message: "학습세트를 삭제할 수 없습니다",
      });
    }

    // 학습세트 삭제 성공 반환
    return res.status(200).send({
      isSuccess: true,
      message: "성공적으로 학습세트를 삭제하였습니다",
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
    // 로그인 여부 확인
    if (!id) {
      return res.status(401).send({
        isSuccess: false,
        message: "로그인된 사용자만 접근 가능합니다",
      });
    }

    // 대상 학습세트 조회
    const quizlet = await Quizlet.findById(quizletId);
    if (!quizlet) {
      return res.status(404).send({
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
        message: "학습세트를 수정할 수 없습니다",
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
        if (!newQuestionCard) {
          return res.status(400).send({
            isSuccess: false,
            message: "학습카드를 생성할 수 없습니다",
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
      message: "성공적으로 학습세트를 수정하였습니다",
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

    // DB에서 학습세트 조회
    const quizlet = await Quizlet.findById(quizletId).populate(
      "questionCardList"
    );
    if (!quizlet) {
      return res.status(404).send({
        isSuccess: false,
        message: "학습세트를 찾을 수 없습니다",
      });
    }

    // 학습세트 정보 반환
    const { title, description, tagList, questionCardList } = quizlet;

    return res.status(200).send({
      isSuccess: true,
      message: "성공적으로 학습세트를 조회하였습니다",
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
      message: "예상치 못한 오류가 발생했습니다",
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

  const { id } = (req as any).user;

  try {
    const quizletLookupPipeline: any = [
      {
        $match: {
          _id: quizletId,
        },
      },
      {
        $lookup: {
          from: "questioncards",
          localField: "questionCardList",
          foreignField: "_id",
          as: "questionCards",
        },
      },
      {
        $lookup: {
          form: "users",
          localField: "owner",
          foreginField: "_id",
          as: "owner",
        },
      },
      {
        $unwind: "$owner",
      },
      {
        $project: {
          title: 1,
          tagList: 1,
          description: 1,
          questionCards: {
            _id: 1,
            title: 1,
          },
          owner: {
            _id: 1,
            name: 1,
            nickname: 1,
            email: 1,
            avatarUrl: 1,
          },
        },
      },
    ];

    // Quizlet 정보 가져오기
    const quizlet = await Quizlet.aggregate(quizletLookupPipeline);

    if (!quizlet) {
      return res.status(404).send({
        isSuccess: false,
        message: "해당 ID에 맞는 학습세트를 찾을 수 없습니다",
      });
    }

    // 로그인한 사용자 정보 가져오기
    const user: any = await User.findById(id).populate("studyLog");

    // 로그인 하지 않았거나 사용자 정보를 찾을 수 없는 경우
    // if(!user) {
    //   return res.status(200).send({
    //     isSuccess
    //   });
    // }

    // 로그인 사용자의 학습기록에서 quizletId와 일치하는 StudyLog 정보 가져오기
    const studyLog = user.studyLog.find((log: any) =>
      log.about.equals(quizletId)
    );

    return res.status(200).send({
      isSuccess: true,
      quizlet: quizlet[0],
      studyLog,
    });
  } catch (error) {
    console.log(`Error: ${error}`);
    return res.status(500).send({
      isSuccess: false,
      message: "예상치 못한 오류가 발생하였습니다",
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
  const { id } = (req as any).user;

  try {
    // 로그인 여부 확인
    if (!id) {
      return res.status(401).send({
        isSuccess: false,
        message: "로그인된 사용자만 접근 가능합니다",
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
    if (!user) {
      return res.status(404).send({
        isSuccess: false,
        message: "사용자 정보를 찾을 수 없습니다",
      });
    }

    // 로그인한 사용자의 학습세트에서 태그목록 추출
    const tagList = [
      ...new Set(user.studyLog.map((log: any) => log.about.tagList).flat()),
    ];
    if(!tagList) {
      return res.status(400).send({
        isSuccess: false,
        message: '사용자의 학습세트 태그목록을 조회할 수 없습니다'
      });
    }

    return res.status(200).send({
      isSuccess: true,
      message: "성공적으로 사용자의 모든 학습세트 태그목록을 조회하였습니다",
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

/* <-- 학습정보 제출 --> */
export const postStudy = async (req: Request, res: Response) => {
  try {
    const { id } = (req as any).user;
    const { quizletId } = req.params;
    const { questionListToReview, questionListToCorrect } = req.body;

    // 로그인 여부 확인
    if (!id) {
      return res.status(401).send({
        isSuccess: false,
        message: "로그인된 사용자만 접근 가능합니다",
      });
    }

    // 로그인한 사용자 정보 조회
    const user = await User.findById(id).populate("studyLog");
    if (!user) {
      return res.status(404).send({
        isSuccess: false,
        message: "사용자를 찾을 수 없습니다",
      });
    }

    // 학습 기록 생성
    const studyLog = await StudyLog.create({
      wrongList: questionListToReview,
      correctList: questionListToCorrect,
      about: quizletId
    });
    if(!studyLog) {
      return res.status(400).send({
        isSuccess: false,
        message: '학습기록을 생성할 수 없습니다'
      });
    }

    user.studyLog.push(studyLog._id);
    await user.save();

    // 성공 반환
    return res.status(200).send({
      isSuccess: true,
      message: '성공적으로 학습기록이 생성되었습니다'
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