import { Request, Response } from "express";
import Quizlet from "../../models/Quizlet";
import User from "../../models/User";

/* <-- 전체 학습세트 검색 --> */
export const getSearch = async (req: Request, res: Response) => {
  try {
    const { keyword, tagList, page, pageSize } = req.query;
    
    const tagListArray = tagList ? (tagList as String).split(',').map(tag => tag.trim()) : tagList;

    // $or 조건을 저장할 배열 초기화
    const orCondition: any[] = [
      { title: { $regex: keyword, $options: 'i' } },
      { description: { $regex: keyword, $options: 'i' } },
      { tagList: { $in: tagListArray } }
    ];

    // 조건에 맞는 학습세트들을 조회
    const quizletList = await Quizlet.aggregate([
      {
        $match: {
          $or: orCondition,
        },
      },
      {
        $lookup: {
          from: "questioncards", // questioncards 컬렉션과 조인
          localField: "questionCardList", // Quizlet 모델의 questionCardList 필드와 조인
          foreignField: "_id", // questioncards 컬렉션의 _id 필드와 조인
          as: "questionCardList", // 조인 결과를 저장할 필드 이름
        },
      },
      {
        $lookup: {
          from: "users", // users 컬렉션과 조인
          localField: "owner", // Quizlet 모델의 owner 필드와 조인
          foreignField: "_id", // users 컬렉션의 _id 필드와 조인
          as: "owner", // 조인 결과를 저장할 필드 이름
        },
      },
      {
        $unwind: "$owner", // owner 배열을 풀어서 개별 문서로 만듬
      },
      {
        $project: {
          title: 1,
          description: 1,
          tagList: 1,
          numOfQuestionCard: { $size: "$questionCardList" }, // questionCardList 필드의 길이를 반환
          owner: {
            _id: 1,
            nickname: 1,
            avatarUrl: 1,
          },
        },
      },
      {
        $skip: (Number(page) - 1) * Number(pageSize), // 페이지 크기와 페이지 번호에 따라 스킵할 문서 수 계산
      },
      {
        $limit: Number(pageSize), // 페이지 크기만큼 결과 반환
      },
    ]);

    // 전체 결과의 갯수를 가져와서 총 페이지 수 계산
    const totalCount = await Quizlet.find({
      $or: [
        { title: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
        { tagList: { $in: tagList } },
      ],
    }).countDocuments();

    const totalPages = Math.ceil(totalCount / Number(pageSize));

    return res.status(200).json({
      isSuccess: true,
      page,
      totalPages,
      quizletList
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

/* <-- 나의 학습세트 검색 --> */
export const getMyQuizletSearch = async (req: Request, res: Response) => {
  const { keyword, tagList, page, pageSize, order } = req.query;

  try {
    // 로그인한 유저 확인
    const user = (req as any).user;
    if (!user) {
      return res.status(401).send({
        isSuccess: false,
        message: "로그인이 필요한 서비스 입니다",
      });
    }

    // 로그인한 사용자의 studyLog 조회
    const userInfo: any = await User.findById(user.id).populate("studyLog");
    if (!userInfo) {
      return res.status(401).send({
        isSuccess: false,
        message: "사용자 정보를 찾을 수 없습니다",
      });
    }

    // $or 조건을 저장할 배열 초기화
    const orCondition: any[] = [
      { title: { $regex: keyword, $options: 'i' } },
      { description: { $regex: keyword, $options: 'i' } },
    ];

    // tagList가 배열인 경우에만 $in 조건을 추가
    if (Array.isArray(tagList)) {
      orCondition.push({ tagList: { $in: tagList } });
    }

    // 현재 로그인한 사용자의 학습기록 중 about에 기록된 학습세트 uuId를 추출
    const quizletIdList: any = userInfo.studyLog.map((log: any) => log.about);

    // 로그인한 사용자의 학습기록에 기록된 quizlet들만 결과로 도출하기 위해 $match 파이프라인 추가
    const quizletList = await Quizlet.aggregate([
      {
        $match: {
          $or: orCondition,
          _id: { $in: quizletIdList }, // 로그인한 사용자의 studyLog에 기록된 quizlet들만 조회
        },
      },
      {
        $lookup: {
          from: "questioncards", // questioncards 컬렉션과 조인
          localField: "questionCardList", // Quizlet 모델의 questionCardList 필드와 조인
          foreignField: "_id", // questioncards 컬렉션의 _id 필드와 조인
          as: "questionCardList", // 조인 결과를 저장할 필드 이름
        },
      },
      {
        $lookup: {
          from: "studylogs", // studylogs 컬렉션과 조인
          localField: "_id", // Quizlet 모델의 _id 필드와 조인
          foreignField: "about", // studylogs 컬렉션의 about 필드와 조인
          as: "studyLogs", // 조인 결과를 저장할 필드 이름
        },
      },
      {
        $unwind: {
          path: "$studyLogs", // studyLogs 배열을 풀어서 개별 문서로 만듬
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          title: 1,
          tagList: 1,
          description: 1,
          numOfQuestions: { $size: "$questionCardList" }, // questionCardList 필드의 길이를 반환
          numOfQuestionsToReview: { $size: { $ifNull: ["$studyLogs.wrongList", []] }}, // StudyLog 모델의 wrongList 필드
          numOfQuestionsToCorrect: {$size: { $ifNull: ["$studyLogs.correctList", []] }}, // StudyLog 모델의 correctList 필드
          lastQuizDate: { $ifNull: ["$studyLogs.updateAt", null] }
        },
      },
      {
        $sort: { numOfQuestionsToCorrect: order === 'ascending' ? 1 : -1 }
      },
      {
        $skip: (Number(page) - 1) * Number(pageSize), // 페이지 크기와 페이지 번호에 따라 스킵할 문서 수 계산
      },
      {
        $limit: Number(pageSize), // 페이지 크기만큼 결과 반환
      },
    ]);

    return res.status(200).send({
      isSuccess: true,
      quizletList
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