import express from "express";
import { MCPRequest, MCPResponse, Tool } from "./types";
import { PrismaClient } from "@prisma/client";
import { userRouter } from "./routes/userRoutes";

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;

// ミドルウェアの設定
app.use(express.json());

// ツールの登録
const tools: Tool[] = [
  {
    name: "hello_world",
    description: "挨拶を返します",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "挨拶する相手の名前",
        },
      },
      required: ["name"],
    },
  },
];

// ツールの実装
const toolImplementations: Record<string, (args: any) => Promise<string>> = {
  hello_world: async (args: { name: string }) => {
    return `Hello, ${args.name}!`;
  },
};

// MCPエンドポイント
app.post("/mcp", (req: any, res: any) => {
  const { messages, tools: requestedTools } = req.body as MCPRequest;

  // 最後のメッセージを取得
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage || lastMessage.role !== "user") {
    return res.status(400).json({ messages: [] });
  }

  // ツール呼び出しを処理
  const toolCalls = lastMessage.tool_calls || [];
  const responses: string[] = [];

  Promise.all(
    toolCalls.map(async (toolCall) => {
      const tool = toolImplementations[toolCall.name];
      if (tool) {
        const result = await tool(toolCall.arguments);
        responses.push(result);
      }
    })
  ).then(() => {
    // レスポンスを返す
    res.json({
      messages: [
        {
          role: "assistant",
          content: responses.join("\n") || "ツールが呼び出されませんでした",
        },
      ],
    } as MCPResponse);
  });
});

// ツール一覧を返すエンドポイント
app.get("/tools", (req: any, res: any) => {
  res.json(tools);
});

// ルーティングの設定
app.use("/api/v1", userRouter);

// エラーハンドリング
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({
      code: 500,
      message: "Internal Server Error",
    });
  }
);

// サーバーの起動
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
