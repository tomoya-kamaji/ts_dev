import { connectConsent, fetchConsentDetail, fetchConsentList } from ".";

describe("sayHello", () => {
  it("取得する", async () => {
    const data = await fetchConsentList();
    console.log(data);
  });

  it("詳細を取得する", async () => {
    const data = await fetchConsentDetail({ id: "1" });
    console.log(data);
  });

  it("接続する", async () => {
    const data = await connectConsent({
      data: { successIds: ["1"], failedIds: [] },
    });
    console.log(data);
  });
});
