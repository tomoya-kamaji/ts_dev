import fs from "fs";
import path from "path";
import {
  connectConsent,
  fetchConsentDetail,
  fetchConsentList,
  healthCheck,
} from ".";

describe("healthCheck", () => {
  it("取得する", async () => {
    const data = await healthCheck();
    console.log(data);
  });
});

describe("sayHello", () => {
  it("取得する", async () => {
    const data = await fetchConsentList();
  });

  it("詳細を取得する", async () => {
    const data = await fetchConsentDetail({ id: "10" });
    publishPdf(data.pdfBase64);
  });

  it("接続する", async () => {
    const data = await connectConsent({
      data: { successIds: ["1"], failedIds: [] },
    });
    console.log(data);
  });
});

// PDFを配置
const publishPdf = (pdfBase64: string) => {
  // Base64をバッファに変換
  const pdfBuffer = Buffer.from(pdfBase64, "base64");

  // 保存先のファイルパス
  const filePath = path.join(__dirname, "test.pdf");

  // ファイルとして保存
  fs.writeFile(filePath, pdfBuffer, (err) => {
    if (err) {
      console.error("PDFの保存に失敗しました:", err);
    } else {
      console.log("PDFが正常に保存されました:", filePath);
    }
  });
};
