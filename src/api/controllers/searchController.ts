import { Request, Response } from "express"
import Quizlet from "../../models/Quizlet";

export const getSearch = async (req: Request, res: Response) => {
  const { keyword, tagList, page } = req.query;

  try {
    // 조건에 맞는 학습세트들을 조회
    const quizletList = await Quizlet.find({
      $or: [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ],
      tagList: { $in: tagList }
    });

    console.log(keyword);

    return res.status(200).json({
      isSuccess: true,
      quizletList
    });
  } catch(error) {
    console.log(`Error: ${error}`);
    return res.status(500).send({
      isSuccess: false,
      message: "예상치 못한 오류 발생",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};