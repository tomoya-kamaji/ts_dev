import { ResultAsync } from "neverthrow";
import { CreatedUser, Input, ValidatedUserProfile } from "./state";

// プロフィールを検証する関数
export type ValidateUserProfile = (
  input: Input
) => ResultAsync<ValidatedUserProfile, Error>;

// ユーザを作成する関数
export type CreateUser = (
  profile: ValidatedUserProfile
) => ResultAsync<CreatedUser, Error>;

// 成功メッセージを返す関数
export type SendSuccessMessage = (
  user: CreatedUser
) => ResultAsync<string, Error>;
