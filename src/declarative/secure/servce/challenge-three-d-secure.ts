import { fromPromise } from "neverthrow";
import {
  ChallengedThreeDSecure,
  ThreeDSecureChallengedCharge,
} from "../model/state";
import { ChallengeThreeDSecure } from "../model/state-machine";

export const challengeThreeDSecure =
  (): // 必要なRepositoryやserviceをDI
  ChallengeThreeDSecure =>
  (input) => {
    const { price, paymentInfo } = input;
    const promise = async (): Promise<ChallengedThreeDSecure> => {
      const charge: ThreeDSecureChallengedCharge = {
        /* Chargeを作成する処理 */
        price,
        paymentInfo,
      };
      return {
        kind: "ChallengedThreeDSecure",
        charge,
      };
    };

    return fromPromise(promise(), (err) => err as Error);
  };
