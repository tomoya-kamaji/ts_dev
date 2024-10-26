import { addFurigana } from ".";

describe("UserRepository", () => {
  it("should create a new user", async () => {
    // const furiganaText = await addFurigana("私は釜地智也です");
    // expect(furiganaText).toBe("私はかじちやです");

    const furiganaText2 = await addFurigana("これはカスタム単語のテストです。");
    expect(furiganaText2).toBe("これはカスタム単語のテストです。");
  });
});
