import mongoose, { Types } from "mongoose";

interface IRefreshToken extends Document {
  userId: Types.ObjectId;
  token: string;
}

const RefreshTokenSchema = new mongoose.Schema<IRefreshToken>({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  token: { type: String, required: true },
});

const RefreshToken = mongoose.model<IRefreshToken>(
  "RefreshToken",
  RefreshTokenSchema
);

export default RefreshToken;
