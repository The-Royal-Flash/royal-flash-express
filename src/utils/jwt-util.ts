import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import RefreshToken from "../models/RefreshToken";

interface Ipayload {
  id: mongoose.Types.ObjectId;
}

const ACCESS_SECRET = process.env.ACCESS_SECRET as string;
const REFRESH_SECRET = process.env.REFRESH_SECRET as string;

const ACCESS_TOKEN_EXPIRATION = "30m";
const REFRESH_TOKEN_EXPIRATION = "7d";

const createAccessToken = (payload: Ipayload) => {
  const accessToken = jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRATION,
    issuer: "Royal Flash",
  });

  return accessToken;
}

const verifyAccessToken = (token: string): mongoose.Types.ObjectId | false => {
  try {
    const decoded: any = jwt.verify(token, ACCESS_SECRET);
    return decoded.id;
  } catch(error) {
    console.error("Error verifying access token:", error);
    return false;
  }
};

const createRefreshToken = () => {
  const refreshToken = jwt.sign({}, REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRATION,
    issuer: "Royal Flash",
  });

  return refreshToken;
}

const verifyRefreshToken = async (token: string): Promise<false | mongoose.Types.ObjectId> => {
  try {
    const decoded: any = jwt.verify(token, REFRESH_SECRET);
    const refreshToken = await RefreshToken.findOne({ userId: decoded.id, token });
    if (!refreshToken) {
      return false;
    }

    return decoded.id;
  } catch(error) {
    console.error("Error verifying refresh token:", error);
    return false;
  }
};

export { createAccessToken, createRefreshToken, verifyAccessToken, verifyRefreshToken };