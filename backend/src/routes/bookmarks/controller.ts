import { db } from "../../database/index.js";

export async function createBookmark(userId: string, postId: string) {
  return await db.bookmark.upsert({
    where: {
      userId_postId: {
        userId,
        postId,
      },
    },
    create: {
      userId,
      postId,
    },
    update: {},
  });
}
export async function getBookmarks(userId: string) {
  return await db.bookmark.findMany({
    where: {
      userId,
    },
  });
}
export async function deleteBookmark(userId: string, postId: string) {
  return await db.bookmark.delete({
    where: {
      userId_postId: {
        userId,
        postId,
      },
    },
  });
}
