import { Request, Response } from "express";
import Quizlet from "../../models/Quizlet";
import QuestionCard from "../../models/QuestionCard";

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
    questionCardsToAdd,
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
      questionCardsToAdd.map(async (questionCard: any) => {
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

/* <-- 학습세트 상세 --> */
export const detailQuizlet = async (req: Request, res: Response) => {
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
