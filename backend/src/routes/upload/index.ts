import { Router } from "express";
import { route, type Router as RouterType } from "@better-upload/server";
import { toNodeHandler } from "@better-upload/server/adapters/node";
import { custom } from "@better-upload/server/clients";

const s3 = custom({
  host: "s3.us-east-1.amazonaws.com",
  accessKeyId: "your-access-key-id",
  secretAccessKey: "your-secret-access-key",
  region: "us-east-1",
  secure: true,
  forcePathStyle: false,
});

const imageRouter: RouterType = {
  client: s3,
  bucketName: "my-bucket",
  routes: {
    images: route({
      fileTypes: ["image/*"],
      multipleFiles: true,
      maxFiles: 4,
    }),
  },
};

const router = Router();
// router.post("/:postId", toNodeHandler(imageRouter));
router.post("/:postId");

export default router;
