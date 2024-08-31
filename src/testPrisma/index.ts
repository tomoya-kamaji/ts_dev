import { PrismaClient } from "@prisma/client";
import { listPostsWithAuthor } from "@prisma/client/sql";

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
  findById: async (id: string) => {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new Error("User not found");
    }
    return user;
  },
  findAll: async () => {
    const users = await prisma.user.findMany();
    return users;
  },
  find: async (id: string) => {
    const users = await prisma.$queryRawTyped(listPostsWithAuthor(id));
    console.table(users);
    console.table(users[0]);
    return users;
  },
};
