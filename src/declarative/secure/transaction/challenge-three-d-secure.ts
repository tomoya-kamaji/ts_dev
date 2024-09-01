// import { ResultAsync, okAsync } from "neverthrow";
// import {
//   PaymentInfo,
//   PaymentInfoRepository,
// } from "../model/paymentInfo";
// import { Input, ChallengedThreeDSecure } from "../model/state";
// import { createInputCommand } from "../servce/create";

// export const challengeThreeDSecure =
//   (paymentInfoRepository: PaymentInfoRepository) =>
//   (input: Input): ResultAsync<ChallengedThreeDSecure, Error> => {
//     return okAsync(input)
//       .andThen(createInputCommand(paymentInfoRepository))
//       .andThen(challengeThKreeDSecure(new PaymentInfoRepositoryImpl()));
//   };

// class PaymentInfoRepositoryImpl implements PaymentInfoRepository {
//   get(userId: string): Promise<PaymentInfo> {
//     return Promise.resolve({
//       method: "credit",
//       transactionId: "transactionId",
//     });
//   }
// }
