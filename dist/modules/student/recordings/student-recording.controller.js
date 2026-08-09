import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as recordingService from './student-recording.service.js';
export const getRecordings = catchAsync(async (req, res) => {
    const result = await recordingService.getStudentRecordings(req.user.id);
    successResponse({ res, data: result, message: 'Recordings retrieved successfully' });
});
export const getRecordingDetail = catchAsync(async (req, res) => {
    const result = await recordingService.getRecordingDetail(req.user.id, req.params.sourceType, req.params.id);
    successResponse({ res, data: result, message: 'Recording details retrieved successfully' });
});
export const createNote = catchAsync(async (req, res) => {
    const result = await recordingService.createPlaybackNote(req.user.id, req.params.sourceType, req.params.id, req.body);
    successResponse({ res, data: result, message: 'Note created successfully', statusCode: 201 });
});
export const updateNote = catchAsync(async (req, res) => {
    const result = await recordingService.updatePlaybackNote(req.user.id, req.params.sourceType, req.params.id, req.params.noteId, req.body);
    successResponse({ res, data: result, message: 'Note updated successfully' });
});
export const deleteNote = catchAsync(async (req, res) => {
    const result = await recordingService.deletePlaybackNote(req.user.id, req.params.sourceType, req.params.id, req.params.noteId);
    successResponse({ res, data: result, message: 'Note deleted successfully' });
});
//# sourceMappingURL=student-recording.controller.js.map