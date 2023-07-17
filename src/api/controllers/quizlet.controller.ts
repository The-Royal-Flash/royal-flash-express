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
    questionCardList.forEach(
      async (questionCard: {
        question: string;
        link: string;
        answer: string;
      }) => {
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
    );

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
