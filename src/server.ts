import express from "express";
import { addFurigana } from "./morphological";

import cors from "cors";

const app = express();

app.use(cors()); // すべてのオリジンを許可
const port = 5000;

app.get("/api/furigana", async (req, res) => {
  const text = req.query.text as string;
  const furiganaText = await addFurigana(text);
  console.log(furiganaText);

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.json({ furiganaText });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
