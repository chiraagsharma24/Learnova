import type { Post } from "@prisma/client";

import { STORAGE_BUCKET, supabase } from "../../config/supabase.js";
import { db } from "../../database/index.js";

function generateSlug(title: string) {
    return title.replace(" ", "-");
}

export async function getPostById(postId: string, userId: string) {
    return await db.post.findUnique({
        where: {
            id: postId,
            authorId: userId,
        },
    });
}

export async function createDraft(
    userId: string,
    title: string,
    desc: string | null = null,
) {
    return await db.post.create({
        data: {
            authorId: userId,
            title,
            desc: desc ?? "",
            content: "",
            featuredImg: "",
            slug: generateSlug(title),
        },
    });
}

export async function updateDraft(
    userId: string,
    postId: string,
    title: string | null,
    desc: string | null = null,
    featuredImg: string | null = null,
    // slug: string | null = null,
    content: string | null,
): Promise<Post | false> {
    // const id = Number(postId);
    // if (!Number.isInteger(id)) return false;

    try {
        return await db.post.update({
            where: {
                id: postId,
                authorId: userId,
            },
            data: {
                ...(title !== null && { title }),
                ...(desc !== null && { desc }),
                ...(content !== null && { content }),
                ...(featuredImg !== null && { featuredImg }),
                // ...(slug !== null && { slug },
                // slug: slug ?? defaultPost?.slug ?? generateSlug(title ?? "no-slug"),
            },
        });
    } catch {
        return false;
    }
}

export async function publishDraft(
    userId: string,
    postId: string,
): Promise<Post | false> {
    try {
        return await db.post.update({
            where: {
                id: postId,
                authorId: userId,
            },
            data: {
                status: "PUBLISHED",
                publishedAt: new Date(),
            },
        });
    } catch {
        return false;
    }
}

export interface UploadResult {
    success: boolean;
    url?: string;
    error?: string;
}

export async function uploadDraftImage(
    userId: string,
    postId: string,
    file: Express.Multer.File,
): Promise<UploadResult> {
    try {
        // Verify the draft belongs to the user
        const draft = await db.post.findUnique({
            where: {
                id: postId,
                authorId: userId,
            },
        });

        if (!draft) {
            return { success: false, error: "Draft not found or unauthorized" };
        }

        // Generate unique filename
        const fileExtension = file.originalname.split(".").pop() || "jpg";
        const fileName = `${userId}/${postId}/${Date.now()}.${fileExtension}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(fileName, file.buffer, {
                contentType: file.mimetype,
                upsert: false,
            });

        if (error) {
            console.error("Supabase upload error:", error);
            return { success: false, error: `Upload failed: ${error.message}` };
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(data.path);

        const publicUrl = urlData.publicUrl;

        // Update the post's featuredImg in database
        await db.post.update({
            where: {
                id: postId,
                authorId: userId,
            },
            data: {
                featuredImg: publicUrl,
            },
        });

        return { success: true, url: publicUrl };
    } catch (err) {
        console.error("Upload error:", err);
        return {
            success: false,
            error: "An unexpected error occurred during upload",
        };
    }
}

export async function deleteDraftImage(
    userId: string,
    postId: string,
): Promise<{ success: boolean; error?: string }> {
    try {
        // Get the draft
        const draft = await db.post.findUnique({
            where: {
                id: postId,
                authorId: userId,
            },
        });

        if (!draft) {
            return { success: false, error: "Draft not found or unauthorized" };
        }

        if (!draft.featuredImg) {
            return { success: true }; // No image to delete
        }

        // Extract file path from URL
        const urlParts = draft.featuredImg.split(`${STORAGE_BUCKET}/`);
        if (urlParts.length > 1) {
            const filePath = urlParts[1];

            // Delete from Supabase Storage
            const { error } = await supabase.storage
                .from(STORAGE_BUCKET)
                .remove([filePath]);

            if (error) {
                console.error("Supabase delete error:", error);
                // Continue anyway to update DB
            }
        }

        // Clear the featuredImg in database
        await db.post.update({
            where: {
                id: postId,
                authorId: userId,
            },
            data: {
                featuredImg: "",
            },
        });

        return { success: true };
    } catch (err) {
        console.error("Delete image error:", err);
        return { success: false, error: "An unexpected error occurred" };
    }
}
