import { ResultAsync } from "neverthrow";
import { CreatedUser, ValidatedUserProfile } from "../model/state";
import { CreateUser } from "../model/state-machine";

export const createUser: CreateUser = (profile: ValidatedUserProfile) => {
  const newUser: CreatedUser = {
    kind: "CreatedUser",
    id: "12345",
    name: profile.name,
    email: profile.email,
  };
  return ResultAsync.fromPromise(
    Promise.resolve(newUser),
    () => new Error("Failed to create user")
  );
};
