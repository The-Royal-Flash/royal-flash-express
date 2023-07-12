import mongoose, { Types } from "mongoose";
import bcrypt from "bcrypt";

interface IUser {
  email: string;
  name: string;
  nickname: string;
  password: string;
  avatarUrl: string;
  studyLog: Types.ObjectId[];
}

const userSchema = new mongoose.Schema<IUser>({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  nickname: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatarUrl: { type: String, default: "" },
  studyLog: [{ type: mongoose.Schema.Types.ObjectId, ref: "StudyLog" }],
});

// Schema 저장시 비밀번호 암호화
userSchema.pre("save", async function () {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

const User = mongoose.model<IUser>("User", userSchema);

export default User;
