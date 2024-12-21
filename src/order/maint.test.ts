import { CalculatedOrder, UnverifiedOrder } from "./domain";
import { execute } from "./main";

describe("order", () => {
  const testCases: {
    description: string;
    input: UnverifiedOrder;
    expected: CalculatedOrder;
  }[] = [
    {
      description: "should verify order with three lines",
      input: {
        kind: "Unverified",
        id: "order-123",
        shippingAddress: "渋谷区渋谷",
        orderLines: [
          { id: "line-1", price: 100 },
          { id: "line-2", price: 200 },
          { id: "line-3", price: 300 },
        ],
      },
      expected: {
        kind: "Calculated",
        id: "order-123",
        shippingAddress: "渋谷区渋谷",
        orderLines: [
          { id: "line-1", price: 100 },
          { id: "line-2", price: 200 },
          { id: "line-3", price: 300 },
        ],
        totalPrice: 600,
      },
    },
    {
      description: "should verify order with one line",
      input: {
        kind: "Unverified",
        id: "order-456",
        shippingAddress: "新宿区新宿",
        orderLines: [{ id: "line-1", price: 500 }],
      },
      expected: {
        kind: "Calculated",
        id: "order-456",
        shippingAddress: "新宿区新宿",
        orderLines: [{ id: "line-1", price: 500 }],
        totalPrice: 500,
      },
    },
  ];

  testCases.forEach(({ description, input, expected }) => {
    it(description, async () => {
      const result = await execute(input);
      expect(result).toEqual(expected);
    });
  });
});
