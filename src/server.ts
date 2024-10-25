import express from "express";
import { addFurigana } from "./morphological";

const app = express();
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
