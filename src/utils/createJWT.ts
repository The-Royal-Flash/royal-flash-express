import jwt from "jsonwebtoken";
import mongoose from "mongoose";

interface Ipayload {
  id: mongoose.Types.ObjectId;
}

export function createAccessToken(payload: Ipayload) {
  const accessToken = jwt.sign(payload, process.env.ACCESS_SECRET as string, {
    expiresIn: "30m",
    issuer: "Royal Flash",
  });

  return accessToken;
}

export function createRefreshToken(payload: Ipayload) {
  const refreshToken = jwt.sign(payload, process.env.REFRESH_SECRET as string, {
    expiresIn: "30m",
    issuer: "Royal Flash",
  });

  return refreshToken;
}
