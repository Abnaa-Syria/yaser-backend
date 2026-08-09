import { HomeworkTargetType, InstructorHomeworkReviewStatus } from '@prisma/client';
import { prisma } from '../../prisma.js';
import { AppError } from '../../utils/AppError.js';
import { createNotification } from '../notifications/notification.service.js';
import { requireCourseAccess } from '../../utils/subscriptionValidator.js';
function getStudentHomeworkStatus(submission) {
    if (!submission)
        return 'NOT_STARTED';
    if (submission.status === 'GRADED')
        return 'COMPLETED';
    if (submission.instructorReviewStatus === InstructorHomeworkReviewStatus.OPENED)
        return 'UNDER_REVIEW';
    return 'SUBMITTED';
}
function getStudentHomeworkStatusLabel(status) {
    switch (status) {
        case 'NOT_STARTED':
            return 'Not Started';
        case 'SUBMITTED':
            return 'Submitted';
        case 'UNDER_REVIEW':
            return 'Under Review';
        case 'COMPLETED':
            return 'Completed';
        default:
            return status;
    }
}
function getDueMeta(dueDate) {
    const now = new Date();
    const msPerDay = 24 * 60 * 60 * 1000;
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfDueDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()).getTime();
    const daysLeft = Math.ceil((startOfDueDay - startOfToday) / msPerDay);
    const isOverdue = dueDate.getTime() < now.getTime();
    let dueText = 'Due today';
    if (daysLeft > 0)
        dueText = `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`;
    if (daysLeft < 0)
        dueText = `${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? '' : 's'} overdue`;
    return { daysLeft, isOverdue, dueText };
}
function getHomeworkTarget(h) {
    const lessons = (h.lessons || []).map((link) => ({
        id: link.lesson.id,
        title: link.lesson.title,
        order: link.lesson.order,
        unitId: link.lesson.section?.unitId ?? link.lesson.section?.unit?.id ?? null,
        unitTitle: link.lesson.section?.unit?.title,
    }));
    return {
        type: h.targetType || 'COURSE',
        courseId: h.courseId || null,
        courseTitle: h.course?.title || null,
        unitId: h.unitId || null,
        unitTitle: h.unit?.title || null,
        lessonIds: lessons.map((lesson) => lesson.id),
        lessons,
    };
}
function toStringList(value) {
    if (!value)
        return [];
    if (Array.isArray(value))
        return value.filter((item) => typeof item === 'string' && item.length > 0);
    if (typeof value === 'string' && value.length > 0)
        return [value];
    return [];
}
function getRelatedCourse(h, target) {
    const lessonTitle = target.lessons.length === 1
        ? `Lesson ${target.lessons[0].order}: ${target.lessons[0].title}`
        : target.lessons.length > 1
            ? `${target.lessons.length} lessons`
            : null;
    const targetLabel = lessonTitle || target.unitTitle || target.courseTitle || null;
    const title = [target.courseTitle, targetLabel]
        .filter(Boolean)
        .filter((part, index, arr) => arr.indexOf(part) === index)
        .join(' - ');
    return {
        id: h.courseId,
        title: title || target.courseTitle || 'Related course',
        courseId: target.courseId,
        courseTitle: target.courseTitle,
        targetType: target.type,
        unitId: target.unitId,
        unitTitle: target.unitTitle,
        lessonIds: target.lessonIds,
        lessons: target.lessons,
    };
}
function getSubmissionConfig(type) {
    return {
        acceptsText: true,
        acceptsFile: type === 'FILE',
        acceptsLink: type === 'LINK',
        maxFileSizeMb: 10,
        allowedFileTypes: type === 'FILE' ? ['PDF', 'JPEG', 'JPG', 'PNG', 'MP3', 'WAV'] : [],
        answerPlaceholder: 'Type your written responses here...',
        fileUploadHint: 'Audio files, PDFs, or images (Max 10MB each)',
    };
}
function shapeStudentHomeworkItem(h) {
    const sub = h.submissions?.[0] || null;
    const status = getStudentHomeworkStatus(sub);
    const due = getDueMeta(h.dueDate);
    const target = getHomeworkTarget(h);
    return {
        id: h.id,
        title: h.title,
        description: h.description,
        instructions: h.description,
        type: h.type,
        attachments: h.attachments,
        requirements: toStringList(h.requirements).length > 0 ? toStringList(h.requirements) : toStringList(h.attachments),
        submissionTips: toStringList(h.submissionTips),
        dueDate: h.dueDate,
        totalPoints: h.totalPoints,
        courseId: h.courseId,
        courseTitle: h.course?.title,
        targetType: target.type,
        target,
        relatedCourse: getRelatedCourse(h, target),
        submissionConfig: getSubmissionConfig(h.type),
        status,
        statusLabel: getStudentHomeworkStatusLabel(status),
        daysLeft: due.daysLeft,
        dueText: due.dueText,
        isOverdue: due.isOverdue,
        submittedAt: sub?.submittedAt ?? null,
        submission: sub
            ? {
                id: sub.id,
                status: sub.status,
                instructorReviewStatus: sub.instructorReviewStatus,
                submittedAt: sub.submittedAt,
                content: sub.content ?? null,
                fileUrl: sub.fileUrl ?? null,
                grade: sub.grade,
                feedback: sub.feedback,
                gradedAt: sub.gradedAt,
            }
            : null,
    };
}
function normalizeHomeworkTarget(data) {
    const lessonIds = Array.isArray(data.lessonIds)
        ? data.lessonIds.filter((lessonId) => typeof lessonId === 'string' && lessonId.length > 0)
        : data.lessonId
            ? [String(data.lessonId)]
            : [];
    let targetType = data.targetType;
    if (!targetType) {
        if (lessonIds.length > 0)
            targetType = HomeworkTargetType.LESSONS;
        else if (data.unitId)
            targetType = HomeworkTargetType.UNIT;
        else
            targetType = HomeworkTargetType.COURSE;
    }
    return {
        targetType,
        courseId: data.courseId,
        unitId: data.unitId,
        lessonIds,
    };
}
async function resolveHomeworkTargetForCourse(courseId, data) {
    const target = normalizeHomeworkTarget({ ...data, courseId });
    if (target.targetType === HomeworkTargetType.COURSE) {
        return { targetType: target.targetType, courseId, unitId: null, lessonIds: [] };
    }
    if (target.targetType === HomeworkTargetType.UNIT) {
        if (!target.unitId)
            throw new AppError('unitId is required for UNIT homework target.', 400);
        const unitRow = await prisma.unit.findUnique({ where: { id: target.unitId }, select: { id: true, courseId: true } });
        if (!unitRow)
            throw new AppError('Unit not found.', 404);
        if (unitRow.courseId !== courseId) {
            throw new AppError('Homework unit target must belong to the course.', 400);
        }
        return { targetType: target.targetType, courseId, unitId: unitRow.id, lessonIds: [] };
    }
    if (target.targetType === HomeworkTargetType.LESSONS) {
        const uniqueLessonIds = [...new Set(target.lessonIds)];
        if (uniqueLessonIds.length === 0)
            throw new AppError('lessonIds is required for LESSONS homework target.', 400);
        const lessons = await prisma.lesson.findMany({
            where: { id: { in: uniqueLessonIds } },
            select: { id: true, section: { select: { unitId: true } } },
        });
        if (lessons.length !== uniqueLessonIds.length) {
            throw new AppError('One or more lessons were not found.', 404);
        }
        const unitIds = [...new Set(lessons.map((lesson) => lesson.section.unitId))];
        const units = await prisma.unit.findMany({
            where: { id: { in: unitIds } },
            select: { id: true, courseId: true },
        });
        const unitCourseMap = new Map(units.map((unit) => [unit.id, unit.courseId]));
        const invalidLesson = lessons.find((lesson) => unitCourseMap.get(lesson.section.unitId) !== courseId);
        if (invalidLesson) {
            throw new AppError('Homework lesson targets must belong to the course.', 400);
        }
        return { targetType: target.targetType, courseId, unitId: null, lessonIds: uniqueLessonIds };
    }
    throw new AppError('Invalid homework target type.', 400);
}
async function assertInstructorOwnsCourse(instructorId, courseId) {
    const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { instructorId: true },
    });
    if (!course || course.instructorId !== instructorId) {
        throw new AppError('Forbidden. You do not own this course.', 403);
    }
}
export const createHomework = async (instructorId, courseId, data) => {
    await assertInstructorOwnsCourse(instructorId, courseId);
    const target = await resolveHomeworkTargetForCourse(courseId, data);
    const homework = await prisma.homework.create({
        data: {
            title: data.title,
            description: data.description,
            type: data.type || 'TEXT',
            targetType: target.targetType,
            attachments: data.attachments || [],
            requirements: toStringList(data.requirements),
            submissionTips: toStringList(data.submissionTips),
            dueDate: new Date(data.dueDate),
            totalPoints: data.totalPoints || 100,
            courseId,
            unitId: target.unitId,
            lessons: target.lessonIds.length
                ? {
                    create: target.lessonIds.map((lessonId) => ({ lesson: { connect: { id: lessonId } } })),
                }
                : undefined,
        },
        include: {
            course: { select: { id: true, title: true } },
            unit: { select: { id: true, title: true } },
            lessons: {
                include: {
                    lesson: {
                        select: {
                            id: true,
                            title: true,
                            order: true,
                            section: { select: { unitId: true, unit: { select: { title: true } } } },
                        },
                    },
                },
            },
        },
    });
    const purchasers = await prisma.coursePurchase.findMany({
        where: { courseId },
        select: { studentId: true },
    });
    const notificationPromises = purchasers.map((purchase) => createNotification(purchase.studentId, 'New Homework Assigned', `Homework: ${homework.title} has been assigned and is due on ${homework.dueDate.toLocaleDateString()}`, 'GENERAL'));
    Promise.allSettled(notificationPromises).catch((err) => console.error('Failed to dispatch some notifications:', err));
    return homework;
};
/** List homework for a course the student has purchased. */
export const listHomeworkForStudentCourse = async (studentId, courseId) => {
    await requireCourseAccess(studentId, courseId);
    const items = await prisma.homework.findMany({
        where: { courseId },
        orderBy: { dueDate: 'desc' },
        include: {
            course: { select: { id: true, title: true } },
            unit: { select: { id: true, title: true } },
            lessons: {
                include: {
                    lesson: {
                        select: {
                            id: true,
                            title: true,
                            order: true,
                            section: { select: { unitId: true, unit: { select: { title: true } } } },
                        },
                    },
                },
            },
            submissions: {
                where: { studentId },
                take: 1,
            },
        },
    });
    return items.map((h) => shapeStudentHomeworkItem(h));
};
/** @deprecated Use listHomeworkForStudentCourse */
export const listHomeworkForStudentCohort = listHomeworkForStudentCourse;
/** All homework across courses the student has purchased. */
export const listAllHomeworkForStudent = async (studentId) => {
    const purchases = await prisma.coursePurchase.findMany({
        where: { studentId },
        select: { courseId: true },
    });
    const courseIds = purchases.map((p) => p.courseId);
    if (courseIds.length === 0)
        return [];
    const homeworks = await prisma.homework.findMany({
        where: { courseId: { in: courseIds } },
        orderBy: { dueDate: 'asc' },
        include: {
            course: { select: { id: true, title: true } },
            unit: { select: { id: true, title: true } },
            lessons: {
                include: {
                    lesson: {
                        select: {
                            id: true,
                            title: true,
                            order: true,
                            section: { select: { unitId: true, unit: { select: { title: true } } } },
                        },
                    },
                },
            },
            submissions: {
                where: { studentId },
                take: 1,
            },
        },
    });
    return homeworks.map((h) => shapeStudentHomeworkItem(h));
};
/** Single assignment for student (validates course access). */
export const getHomeworkAssignmentForStudent = async (studentId, homeworkId) => {
    const h = await prisma.homework.findUnique({
        where: { id: homeworkId },
        include: {
            course: { select: { id: true, title: true } },
            unit: { select: { id: true, title: true } },
            lessons: {
                include: {
                    lesson: {
                        select: {
                            id: true,
                            title: true,
                            order: true,
                            section: { select: { unitId: true, unit: { select: { title: true } } } },
                        },
                    },
                },
            },
            submissions: {
                where: { studentId },
                take: 1,
            },
        },
    });
    if (!h)
        throw new AppError('Homework not found', 404);
    await requireCourseAccess(studentId, h.courseId);
    return shapeStudentHomeworkItem(h);
};
export const submitHomework = async (studentId, homeworkId, data) => {
    const homework = await prisma.homework.findUnique({ where: { id: homeworkId } });
    if (!homework)
        throw new AppError('Homework not found', 404);
    await requireCourseAccess(studentId, homework.courseId);
    const content = data.content != null && String(data.content).trim() !== '' ? String(data.content).trim() : null;
    const fileUrl = data.fileUrl != null && String(data.fileUrl).trim() !== '' ? String(data.fileUrl).trim() : null;
    if (homework.type === 'TEXT' && !content) {
        throw new AppError('Written answer is required for this assignment.', 400);
    }
    if (homework.type === 'LINK' && !content) {
        throw new AppError('A valid link is required for this assignment.', 400);
    }
    if (homework.type === 'FILE' && !fileUrl) {
        throw new AppError('A file or file URL is required for this assignment.', 400);
    }
    return prisma.homeworkSubmission.upsert({
        where: { studentId_homeworkId: { studentId, homeworkId } },
        update: {
            content,
            fileUrl,
            submittedAt: new Date(),
            status: 'PENDING',
            instructorReviewStatus: InstructorHomeworkReviewStatus.NOT_OPENED,
            grade: null,
            feedback: null,
            gradedAt: null,
        },
        create: {
            studentId,
            homeworkId,
            content,
            fileUrl,
            submittedAt: new Date(),
            status: 'PENDING',
        },
    });
};
export const gradeSubmission = async (instructorId, submissionId, grade, feedback) => {
    const submission = await prisma.homeworkSubmission.findUnique({
        where: { id: submissionId },
        include: { homework: { include: { course: true } } },
    });
    if (!submission)
        throw new AppError('Submission not found', 404);
    if (submission.homework.course.instructorId !== instructorId) {
        throw new AppError('Forbidden. You do not own this course.', 403);
    }
    const updated = await prisma.homeworkSubmission.update({
        where: { id: submissionId },
        data: {
            grade,
            feedback,
            status: 'GRADED',
            gradedAt: new Date(),
            instructorReviewStatus: InstructorHomeworkReviewStatus.CLOSED,
        },
    });
    await createNotification(submission.studentId, 'Homework Graded', `Your submission for ${submission.homework.title} has been graded. You received ${grade}/${submission.homework.totalPoints}.`, 'GENERAL');
    return updated;
};
function computeHomeworkQueueCounts(rows) {
    let notOpened = 0;
    let opened = 0;
    let closed = 0;
    for (const r of rows) {
        if (r.status === 'GRADED' || r.instructorReviewStatus === InstructorHomeworkReviewStatus.CLOSED) {
            closed += 1;
        }
        else if (r.instructorReviewStatus === InstructorHomeworkReviewStatus.OPENED) {
            opened += 1;
        }
        else {
            notOpened += 1;
        }
    }
    return { notOpened, opened, closed };
}
/** All submitted homework for courses this instructor teaches. */
export const listInstructorHomeworkQueue = async (instructorId) => {
    const submissions = await prisma.homeworkSubmission.findMany({
        where: {
            submittedAt: { not: null },
            homework: { course: { instructorId } },
        },
        orderBy: { submittedAt: 'desc' },
        include: {
            student: { select: { id: true, fullName: true, email: true } },
            homework: {
                select: {
                    id: true,
                    title: true,
                    type: true,
                    totalPoints: true,
                    dueDate: true,
                    courseId: true,
                    course: { select: { id: true, title: true } },
                },
            },
        },
    });
    const counts = computeHomeworkQueueCounts(submissions);
    return { submissions, counts };
};
export const patchInstructorSubmissionReviewStatus = async (instructorId, submissionId, instructorReviewStatus) => {
    const submission = await prisma.homeworkSubmission.findUnique({
        where: { id: submissionId },
        include: { homework: { include: { course: true } } },
    });
    if (!submission)
        throw new AppError('Submission not found', 404);
    if (submission.homework.course.instructorId !== instructorId) {
        throw new AppError('Forbidden. You do not own this course.', 403);
    }
    if (!submission.submittedAt)
        throw new AppError('Submission has not been turned in yet.', 400);
    if (submission.status === 'GRADED') {
        if (instructorReviewStatus === InstructorHomeworkReviewStatus.CLOSED) {
            return submission;
        }
        throw new AppError('Graded submissions cannot change review state.', 400);
    }
    return prisma.homeworkSubmission.update({
        where: { id: submissionId },
        data: { instructorReviewStatus },
    });
};
export const deleteHomework = async (instructorId, homeworkId) => {
    const homework = await prisma.homework.findUnique({
        where: { id: homeworkId },
        include: { course: true },
    });
    if (!homework)
        throw new AppError('Homework not found', 404);
    if (homework.course.instructorId !== instructorId) {
        throw new AppError('Forbidden. You do not own this course.', 403);
    }
    await prisma.homework.delete({ where: { id: homeworkId } });
    return { id: homeworkId, deleted: true };
};
//# sourceMappingURL=homework.service.js.map