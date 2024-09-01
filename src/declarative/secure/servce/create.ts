import { fromPromise } from "neverthrow";
import { CreateInputCommand } from "../model/state-machine";
import { PaymentInfoRepository } from "../model/paymentInfo";

/**
 * InputCommandを生成する
 */
export const createInputCommand =
  (paymentInfoRepository: PaymentInfoRepository): CreateInputCommand =>
  (input) => {
    const { userID, price } = input;
    return fromPromise(
      paymentInfoRepository.get(userID).then((paymentInfo) => ({
        kind: "InputCommand",
        price,
        paymentInfo,
      })),
      (err) => err as Error
    );
  };
