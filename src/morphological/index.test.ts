import { addFurigana } from ".";

describe("UserRepository", () => {
  it("should create a new user", async () => {
    const furiganaText = await addFurigana("私は釜地智也です");
    expect(furiganaText).toBe("私はかじちやです");
  });
});
