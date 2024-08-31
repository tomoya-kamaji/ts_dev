import { PrismaClient } from "@prisma/client";
import { findUser } from "@prisma/client/sql";

const prisma = new PrismaClient();

export const UserRepository = {
  create: async (data: { id: string; name: string }) => {
    const newUser = await prisma.user.create({
      data: {
        id: data.id,
        name: data.name,
      },
    });
    return newUser;
  },
  find: async (id: string) => {
    // prisma/sql/findUser.sqlからfindUser関数を生成している
    const users = await prisma.$queryRawTyped(findUser(id));
    console.table(users);
    console.table(users[0]);
    return users;
  },
};
