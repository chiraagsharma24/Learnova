import { Lesson } from "../models/Lesson.js";
import { LessonProgress } from "../models/LessonProgress.js";
import { Enrollment } from "../models/Enrollment.js";

/**
 * Recalculates and updates the completion percentage for a specific user enrollment.
 */
export async function recalculateEnrollmentProgress(userId: string, courseId: any) {
    const totalLessons = await Lesson.countDocuments({ courseId, status: "published" });
    const completedLessons = await LessonProgress.countDocuments({ userId, courseId, completed: true });

    const completionPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    await Enrollment.findOneAndUpdate(
        { userId, courseId },
        {
            completionPercentage,
            ...(completionPercentage === 100 ? { completedAt: new Date() } : { $unset: { completedAt: "" } })
        },
        { returnDocument: 'after' }
    );

    return completionPercentage;
}

/**
 * Recalculates course completion for all students enrolled in a course.
 * Useful when lessons are added, removed, or their status changes.
 */
export async function recalculateAllCourseEnrollments(courseId: any) {
    const enrollments = await Enrollment.find({ courseId });

    const updates = enrollments.map(enrollment =>
        recalculateEnrollmentProgress(enrollment.userId, courseId)
    );

    await Promise.all(updates);
}
