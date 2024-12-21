import { ResultAsync, okAsync } from "neverthrow";
import { Purchase, Cart } from "../model/state";

// 購入処理を行う関数
export const purchase = (cart: Cart, userId: string): ResultAsync<Purchase, Error> => {
    const purchaseDetails: Purchase = {
        userId,
        cart,
    };
    return okAsync(purchaseDetails);
};