// import type { APIError } from "better-auth";
// import type { User } from "@prisma/client";

export type Session = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  expiresAt: Date;
  token: string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type User = {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthSession = {
  session: Session;
  user: User;
};

export type SignUpResponse = {
  token: string;
  user: User;
};
