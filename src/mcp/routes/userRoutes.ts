import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// ユーザー一覧の取得
router.get("/users", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const users = await prisma.user.findMany({
      take: limit,
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: "Internal Server Error",
    });
  }
});

// 新規ユーザーの作成
router.post("/users", async (req, res) => {
  try {
    const { username, email } = req.body;
    const user = await prisma.user.create({
      data: {
        username,
        email,
      },
    });
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({
      code: 400,
      message: "Invalid Request",
    });
  }
});

// 特定ユーザーの取得
router.get("/users/:userId", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.params.userId,
      },
    });
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: "User Not Found",
      });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: "Internal Server Error",
    });
  }
});

// ユーザー情報の更新
router.put("/users/:userId", async (req, res) => {
  try {
    const { username, email } = req.body;
    const user = await prisma.user.update({
      where: {
        id: req.params.userId,
      },
      data: {
        username,
        email,
      },
    });
    res.json(user);
  } catch (error) {
    res.status(404).json({
      code: 404,
      message: "User Not Found",
    });
  }
});

// ユーザーの削除
router.delete("/users/:userId", async (req, res) => {
  try {
    await prisma.user.delete({
      where: {
        id: req.params.userId,
      },
    });
    res.status(204).send();
  } catch (error) {
    res.status(404).json({
      code: 404,
      message: "User Not Found",
    });
  }
});

export const userRouter = router;
