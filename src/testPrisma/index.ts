import { PrismaClient } from "@prisma/client";

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
    return user;
  },
  findAll: async () => {
    const users = await prisma.user.findMany();
    return users;
  },
};
