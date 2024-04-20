import { produce, consume } from ".";

describe("sayHello", () => {
  it("should return 'Hello, World!'", async () => {
    const ids = [
      "article-1",
      "article-2",
      "article-3",
      "article-4",
      "article-5",
      "article-6",
      "article-7",
      "article-8",
      "article-9",
      "article-10",
    ];

    produce(ids); // URLをジョブキューに追加

    console.time("consume");

    // タスクを処理
    const consumers = Array.from({ length: 10 }, () => consume());
    await Promise.all(consumers);
    console.timeEnd("consume");
  });
});
