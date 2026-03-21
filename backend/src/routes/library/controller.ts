import { db } from "../../database/index.js";
import { PostType } from "../../types/post.js";

export async function getYourLists(userId: string) {
  const [publishedPostsCount, draftsCount, bookmarkedCount, yourLists] = await Promise.all([
    db.post.count({
      where: {
        authorId: userId,
        status: "PUBLISHED",
      },
    }),

    db.post.count({
      where: {
        authorId: userId,
        status: "DRAFT",
      },
    }),

    db.bookmark.count({
      where: {
        userId,
      },
    }),

    db.list.findMany({
      where: {
        authorId: userId,
      },
    }),
  ]);

  return {
    postsCount: publishedPostsCount,
    draftsCount,
    bookmarkedCount,
    list: yourLists,
  };
}

export async function getPosts(userId: string, postType: PostType) {
  if (postType === "BOOKMARKED") {
    const bookmarkedPosts = (
      await db.bookmark.findMany({
        where: {
          userId,
        },
      })
    ).map((b) => b.postId);

    return await db.post.findMany({
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
        id: {
          in: bookmarkedPosts,
        },
      },
    });
  }

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
      authorId: userId,
      status: postType,
    },
  });
}
