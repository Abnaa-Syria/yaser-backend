import { catchAsync } from '../../utils/catchAsync.js';
import * as trialService from './trial.service.js';
import * as trialLearning from './trial-learning.service.js';
import { getDeviceMetadata } from './trial-device.js';
export const getPublicConfig = catchAsync(async (_req, res) => {
    const data = await trialService.getPublicTrialConfig();
    res.status(200).json({ success: true, data });
});
export const start = catchAsync(async (req, res) => {
    const meta = getDeviceMetadata(req);
    const data = await trialService.startTrialSession({
        fingerprint: typeof req.body?.fingerprint === 'string' ? req.body.fingerprint : meta.fingerprint,
        userAgent: meta.userAgent,
        deviceName: typeof req.body?.deviceName === 'string' ? req.body.deviceName : meta.deviceName,
        os: typeof req.body?.os === 'string' ? req.body.os : meta.os,
        ipAddress: meta.ipAddress,
    });
    res.status(data.resumed ? 200 : 201).json({
        success: true,
        message: data.resumed ? 'Free trial resumed' : 'Free trial started',
        data,
    });
});
export const me = catchAsync(async (req, res) => {
    const fingerprint = (typeof req.get('x-device-fingerprint') === 'string' && req.get('x-device-fingerprint')) ||
        (typeof req.body?.fingerprint === 'string' ? req.body.fingerprint : undefined) ||
        undefined;
    const data = await trialService.getTrialMe(req.trial.trialId, fingerprint?.trim() || undefined);
    res.status(200).json({ success: true, data });
});
export const listCourses = catchAsync(async (_req, res) => {
    const courses = await trialService.getTrialCourses();
    res.status(200).json({ success: true, data: { courses } });
});
export const courseUnits = catchAsync(async (req, res) => {
    const units = await trialService.getTrialCourseContent(String(req.params.id));
    res.status(200).json({ success: true, data: units });
});
export const lessonPlayback = catchAsync(async (req, res) => {
    const data = await trialService.getTrialLessonPlayback(String(req.params.lessonId), req.trial.trialId);
    res.status(200).json({ success: true, message: 'Lesson playback authorized', data });
});
export const recordings = catchAsync(async (_req, res) => {
    const items = await trialService.getTrialRecordings();
    res.status(200).json({ success: true, data: { recordings: items } });
});
export const flashcards = catchAsync(async (req, res) => {
    const items = await trialLearning.listTrialFlashcards({
        courseId: typeof req.query.courseId === 'string' ? req.query.courseId : undefined,
        unitId: typeof req.query.unitId === 'string' ? req.query.unitId : undefined,
        lessonId: typeof req.query.lessonId === 'string' ? req.query.lessonId : undefined,
    });
    res.status(200).json({ success: true, data: items });
});
export const listExams = catchAsync(async (req, res) => {
    const items = await trialLearning.listTrialExams(req.trial.trialId, {
        courseId: typeof req.query.courseId === 'string' ? req.query.courseId : undefined,
        unitId: typeof req.query.unitId === 'string' ? req.query.unitId : undefined,
        lessonId: typeof req.query.lessonId === 'string' ? req.query.lessonId : undefined,
    });
    res.status(200).json({ success: true, data: items });
});
export const getExam = catchAsync(async (req, res) => {
    const data = await trialLearning.getTrialExamDetails(req.trial.trialId, String(req.params.id));
    res.status(200).json({ success: true, data });
});
export const startExam = catchAsync(async (req, res) => {
    const data = await trialLearning.startTrialExam(req.trial.trialId, String(req.params.id));
    res.status(201).json({ success: true, message: 'Exam started', data });
});
export const submitExam = catchAsync(async (req, res) => {
    const data = await trialLearning.submitTrialExam(req.trial.trialId, String(req.params.id), req.body.answers || []);
    res.status(200).json({ success: true, message: 'Exam submitted and graded successfully', data });
});
export const examResults = catchAsync(async (req, res) => {
    const data = await trialLearning.getTrialExamResult(req.trial.trialId, String(req.params.submissionId));
    res.status(200).json({ success: true, data });
});
//# sourceMappingURL=trial.controller.js.map