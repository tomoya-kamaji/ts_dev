// validateUserProfile.ts
import { fromPromise } from "neverthrow";
import { Input, ValidatedUserProfile } from "../model/state";
import { ValidateUserProfile } from "../model/state-machine";

export const validateUserProfile: ValidateUserProfile = (input: Input) => {
  if (!input.name || !input.email.includes("@")) {
    return fromPromise(
      Promise.reject(new Error("Invalid user profile")),
      (err) => err as Error
    );
  }
  const validatedProfile: ValidatedUserProfile = {
    kind: "ValidatedUserProfile",
    name: input.name,
    email: input.email,
  };
  return fromPromise(Promise.resolve(validatedProfile), (err) => err as Error);
};
