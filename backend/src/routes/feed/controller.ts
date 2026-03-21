import { db } from "../../database/index.js";

export async function getFeed(userId: string) {
  // const followingIds = (await db.follow.findMany({ where: { followerId: userId } })).map((f) => f.followingId);

  // return await db.post.findMany({
  // 	where: { authorId: { in: followingIds } },
  // 	orderBy: { createdAt: "desc" },
  // });
  return db.post.findMany({
    select: {
      id: true,
      title: true,
      featuredImg: true,
      slug: true,
      publishedAt: true,
      viewsCount: true,
      author: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
    where: {
      status: "PUBLISHED",
    },
  });
}
