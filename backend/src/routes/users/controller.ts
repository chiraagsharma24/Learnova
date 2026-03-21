import { db } from "../../database/index.js";

export async function getUserInfo(userId: string, originalUserId: string) {
  const [userInfo, postsCount, followersCount, followingCount, followedByYou] = await Promise.all([
    // User info
    db.userInfo.findUnique({
      where: {
        userId,
      },
      select: {
        username: true,
        userId: true,
        bio: true,
        user: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
      },
    }),

    // Published posts count
    db.post.count({
      where: {
        authorId: userId,
        status: "PUBLISHED",
      },
    }),

    // Followers count
    db.follow.count({
      where: {
        followingId: userId,
      },
    }),

    // Following count
    db.follow.count({
      where: {
        followerId: userId,
      },
    }),

    // FollowedByYou
    db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: originalUserId,
          followingId: userId,
        },
      },
    }),
  ]);
  if (!userInfo) return false;

  return {
    user: {
      userId,
      username: userInfo?.username,
      bio: userInfo?.bio,
      ...userInfo?.user,
    },
    postsCount,
    followersCount,
    followingCount,
    followedByYou: Boolean(followedByYou),
  };
}

export async function getUserPosts(userId: string) {
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
      authorId: userId,
      status: "PUBLISHED",
    },
  });
}

/**
 *
 * @param userId
 * @returns users who follow the current user
 */
export async function getFollowers(userId: string) {
  const followers = await db.follow.findMany({
    where: {
      followingId: userId,
    },
    select: {
      follower: {
        select: {
          id: true,
          name: true,
          image: true,
          userInfo: {
            select: {
              username: true,
            },
          },
          // followedByYou?: boolean;
        },
      },
    },
  });
  return followers.map((f) => ({
    id: f.follower.id,
    name: f.follower.name,
    image: f.follower.image,
    username: f.follower.userInfo?.username,
  }));
}

/**
 *
 * @param userId
 * @returns users whom the current user is following
 */
export async function getFollowings(userId: string) {
  const followings = await db.follow.findMany({
    where: {
      followerId: userId,
    },
    select: {
      following: {
        select: {
          id: true,
          name: true,
          image: true,
          userInfo: {
            select: {
              username: true,
            },
          },
          // followedByYou?: boolean;
        },
      },
    },
  });
  return followings.map((f) => ({
    id: f.following.id,
    name: f.following.name,
    image: f.following.image,
    username: f.following.userInfo?.username,
  }));
}

/**
 *
 * @param followerId id of the user who follows the other
 * @param followingId id of the user who is being followed
 * @returns
 */
export async function follow(followerId: string, followingId: string) {
  const [follower, following] = await Promise.all([
    db.user.findUnique({ where: { id: followerId } }),
    db.user.findUnique({ where: { id: followingId } }),
  ]);
  if (!(following && follower)) return false;

  try {
    await db.follow.create({
      data: {
        followerId: follower.id,
        followingId: following.id,
      },
    });
  } catch {
    return false;
  }
  return following;
}

/**
 *
 * @param followerId id of the user who follows the other
 * @param followingId id of the user who is being followed
 * @returns
 */
export async function unfollow(followerId: string, followingId: string) {
  const [follower, following] = await Promise.all([
    db.user.findUnique({ where: { id: followerId } }),
    db.user.findUnique({ where: { id: followingId } }),
  ]);
  if (!(following && follower)) return false;

  try {
    await db.follow.delete({
      where: {
        followerId_followingId: {
          followerId: follower.id,
          followingId: following.id,
        },
      },
    });
  } catch {
    return false;
  }

  return following;
}
