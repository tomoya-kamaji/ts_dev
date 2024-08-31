import { ulid } from "ulid";
import { UserRepository } from ".";

describe("UserRepository", () => {
  it("should create a new user", async () => {
    const userId = ulid();
    const user = await UserRepository.create({ id: userId, name: "太郎" });
    expect(user).toHaveProperty(userId);
  });
});
