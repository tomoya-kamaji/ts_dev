import { Input } from "../model/state";
import { createUser } from "../service/createUser";
import { sendSuccessMessage } from "../service/sendSuccessMessage";
import { validateUserProfile } from "../service/validateUserProfile";

// ユーザのプロフィール入力
const iput: Input = {
  kind: "Input",
  name: "John Doe",
  email: "john@example.com",
};

validateUserProfile(iput)
  .andThen(createUser)
  .andThen(sendSuccessMessage)
  .match(
    (message: string) => console.log(message), // 成功メッセージ
    (error: Error) => console.error(error.message) // エラーメッセージ
  );
