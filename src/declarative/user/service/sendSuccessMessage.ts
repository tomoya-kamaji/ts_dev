import { ResultAsync } from "neverthrow";
import { CreatedUser } from "../model/state";
import { SendSuccessMessage } from "../model/state-machine";

export const sendSuccessMessage: SendSuccessMessage = (user: CreatedUser) => {
  const message = `User ${user.name} was successfully created with email ${user.email}`;
  return ResultAsync.fromPromise(
    Promise.resolve(message),
    () => new Error("Failed to send message")
  );
};
