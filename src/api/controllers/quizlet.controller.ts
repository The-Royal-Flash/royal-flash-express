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
        message: "Not Authorized",
      });
    }

    // Quizlet 생성
    const newQuizlet = await Quizlet.create({
      title,
      description,
      tagList,
      owner: (req as any).user.id,
    });

    // 생성된 Quizlet 호출
    const quizlet = await Quizlet.findById(newQuizlet._id);
    if (!quizlet) {
      return res.status(400).send({
        isSuccess: false,
        message: "Quizlet creation error",
      });
    }

    // Question Card 생성
    for (const questionCard of questionCardList) {
      const newQuestionCard = await QuestionCard.create({
        question: questionCard.question,
        answer: questionCard.answer,
        link: questionCard.link,
      });
      if (!newQuestionCard) {
        return res.status(400).send({
          isSuccess: false,
          message: "QuestionCard creation error",
        });
      }

      // 생성된 Quizlet의 Question Card List에 Question Card 추가
      quizlet.questionCardList.push(newQuestionCard._id);
    }

    // Quizlet 저장
    quizlet.save();

    // 생성 성공 반환
    return res.status(200).send({
      isSuccess: true,
      message: "Creation successful",
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).send({
        isSuccess: false,
        message: error.message,
      });
    } else {
      return res.status(400).send({
        isSuccess: false,
        message: String(error),
      });
    }
  }
};

/* <-- 학습세트 삭제 --> */
export const deleteQuizlet = async (req: Request, res: Response) => {
  const { quizletId } = req.params;
  const { id } = (req as any).user;

  try {
    // DB에서 Quizlet 호출
    const quizlet = await Quizlet.findById(quizletId);
    if (!quizlet) {
      return res.status(400).send({
        isSuccess: false,
        message: "Quizlet not found",
      });
    }

    // 검색된 Quizlet 소유권이 로그인한 사용자와 다를 경우
    if (String(quizlet.owner) !== String(id)) {
      return res.status(400).send({
        isSuccess: false,
        message: "Permission error",
      });
    }

    // Quizlet이 소유한 Question Card 삭제
    for (const questionCard of quizlet.questionCardList) {
      const deletedQuestionCard = await QuestionCard.deleteOne({
        _id: questionCard,
      });
      if (!deletedQuestionCard) {
        return res.status(400).send({
          isSuccess: false,
          message: "Question card deleting error",
        });
      }
    }

    // Quizlet 삭제
    const deletedQuizlet = await Quizlet.deleteOne({ _id: quizlet._id });
    if (!deletedQuizlet) {
      return res.status(400).send({
        isSuccess: false,
        message: "Quizlet deleting error",
      });
    }

    // 삭제 성공 반환
    return res.status(200).send({
      isSuccess: true,
      message: "Quizlet deleted successful",
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).send({
        isSuccess: false,
        message: error.message,
      });
    } else {
      return res.status(400).send({
        isSuccess: false,
        message: String(error),
      });
    }
  }
};
