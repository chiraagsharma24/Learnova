import { type BetterAuthPlugin } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";

import { db } from "../database/index.js";
import type { SignUpResponse } from "../types/auth.js";

export const createUserInfoAfterSignUp = () => {
  return {
    id: "create-userInfo",
    hooks: {
      after: [
        {
          matcher: (context) => {
            return context.path === "/sign-up/email" && context.method === "POST";
          },
          handler: createAuthMiddleware(async (ctx) => {
            try {
              const returned = ctx.context.returned as SignUpResponse;

              // Check if returned has user property
              if (!(returned && returned.user)) {
                console.error("No user found in response");
                return;
              }

              const user = returned.user;
              await db.userInfo.create({
                data: {
                  userId: user.id,
                  username: user.email,
                },
              });

              console.log(`Successfully created user_info for user: ${user.id}`);
            } catch (err) {
              console.error("Error creating user_info:", err);
            }
          }),
        },
      ],
    },
  } satisfies BetterAuthPlugin;
};
