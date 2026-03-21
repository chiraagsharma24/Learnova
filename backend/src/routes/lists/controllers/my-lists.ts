import { db } from "../../../database/index.js";

export async function getMyLists(userId: string) {
  const listIds = (
    await db.userSavedList.findMany({
      where: { userId },
    })
  ).map((ul) => ul.listId);

  return await db.list.findMany({
    where: {
      id: {
        in: listIds,
      },
    },
  });
}

export async function createMyList(userId: string, title: string, desc: string | null) {
  return await db.list.create({
    data: {
      authorId: userId,
      title,
      desc,
    },
  });
}
