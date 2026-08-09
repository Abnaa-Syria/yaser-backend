import { Request, Response } from 'express';
import * as adminExamService from './admin-exam.service.js';
import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import { generateExamSubmissionsXlsx } from '../../../utils/excelGenerator.js';

export const createExam = catchAsync(async (req: Request, res: Response) => {
  const result = await adminExamService.createExam(req.body);
  successResponse({ res, data: result, message: 'Exam created successfully', statusCode: 201 });
});

export const updateExam = catchAsync(async (req: Request, res: Response) => {
  const result = await adminExamService.updateExam(req.params.id as string, req.body);
  successResponse({ res, data: result, message: 'Exam updated successfully' });
});

export const deleteExam = catchAsync(async (req: Request, res: Response) => {
  const result = await adminExamService.deleteExam(req.params.id as string);
  successResponse({ res, data: result, message: 'Exam deleted successfully' });
});

export const addQuestion = catchAsync(async (req: Request, res: Response) => {
  const result = await adminExamService.addQuestion(req.params.id as string, req.body);
  successResponse({ res, data: result, message: 'Question added successfully', statusCode: 201 });
});

export const updateQuestion = catchAsync(async (req: Request, res: Response) => {
  const result = await adminExamService.updateQuestion(req.params.questionId as string, req.body);
  successResponse({ res, data: result, message: 'Question updated successfully' });
});

export const removeQuestion = catchAsync(async (req: Request, res: Response) => {
  const result = await adminExamService.removeQuestion(req.params.questionId as string);
  successResponse({ res, data: result, message: 'Question removed successfully' });
});

export const getAllExams = catchAsync(async (req: Request, res: Response) => {
  const { exams, pagination } = await adminExamService.getAllExams(req.query as any);
  successResponse({ res, data: { exams, pagination }, results: exams.length, message: 'Exams fetched successfully' });
});

export const getExam = catchAsync(async (req: Request, res: Response) => {
  const result = await adminExamService.getExamById(req.params.id as string);
  successResponse({ res, data: result, message: 'Exam details fetched successfully' });
});

export const getExamSubmissions = catchAsync(async (req: Request, res: Response) => {
  const { submissions, pagination } = await adminExamService.getExamSubmissions(req.params.id as string, req.query as any);
  successResponse({ res, data: { submissions, pagination }, results: submissions.length });
});

export const exportSubmissionsXlsx = catchAsync(async (req: Request, res: Response) => {
  const examId = req.params.id as string;
  const exam = await adminExamService.getExamById(examId);
  const { submissions } = await adminExamService.getExamSubmissions(examId, { page: 1, limit: 10000 });

  const rows = submissions.map((sub: any) => ({
    studentName: sub.student?.fullName || 'طالب مجهول',
    studentEmail: sub.student?.email || '—',
    attempt: sub.attempt || 1,
    score: sub.totalScore !== null && sub.totalScore !== undefined ? sub.totalScore : 'قيد التصحيح',
    totalPoints: sub.exam?.totalPoints || 100,
    status: sub.isPassed === true ? 'ناجح' : sub.isPassed === false ? 'راسب' : 'قيد التقييم',
    submittedAt: sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString('ar-EG') : 'غير مكتمل',
  }));

  const buffer = await generateExamSubmissionsXlsx(exam?.title || 'الاختبار', rows);

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=exam-submissions-${examId}.xlsx`);
  return res.send(buffer);
});

