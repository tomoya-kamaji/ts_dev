// ユーザのプロフィールを入力するための状態
export type Input = {
  kind: "Input";
  name: string;
  email: string;
};

// 検証済みのプロフィール
export type ValidatedUserProfile = {
  kind: "ValidatedUserProfile";
  name: string;
  email: string;
};

// データベースに保存されたユーザ
export type CreatedUser = {
  kind: "CreatedUser";
  id: string;
  name: string;
  email: string;
};
