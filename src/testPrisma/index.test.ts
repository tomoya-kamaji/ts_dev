import { ulid } from "ulid";
import { UserRepository } from ".";

describe("UserRepository", () => {
  it("should create a new user", async () => {
    const userId = ulid();
    await UserRepository.create({ id: userId, name: "太郎" });

    await UserRepository.find(userId);
  });
});
