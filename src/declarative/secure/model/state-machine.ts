import { ResultAsync } from "neverthrow";
import {
  type Captured,
  type ChallengedThreeDSecure,
  type CheckedThreeDSecureInvalid,
  type CheckedThreeDSecureValid,
  type Input,
  type InputCommand,
  type Refunded,
} from "./state";

// InputからInputCommandに遷移する
export type CreateInputCommand = (
  input: Input
) => ResultAsync<InputCommand, Error>;

// InputCommandから3Dセキュアの検証状態に遷移する
export type ChallengeThreeDSecure = (
  input: InputCommand
) => ResultAsync<ChallengedThreeDSecure, Error>;

// 3Dセキュアの検証を行い、有効な状態と無効な状態に遷移する
export type CheckThreeDSecureIsValid = (
  input: ChallengedThreeDSecure
) => ResultAsync<CheckedThreeDSecureValid | CheckedThreeDSecureInvalid, Error>;

// 3Dセキュアが有効な場合、キャプチャを行う
export type Capture = (
  input: CheckedThreeDSecureValid
) => ResultAsync<Captured, Error>;

// 3Dセキュアが無効な場合、確保した金額の返金を行う
export type Refund = (
  input: CheckedThreeDSecureInvalid
) => ResultAsync<Refunded, Error>;
