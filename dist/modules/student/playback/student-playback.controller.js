import { catchAsync } from '../../../utils/catchAsync.js';
import { successResponse } from '../../../utils/responseHandler.js';
import * as playbackService from './student-playback.service.js';
export const getLessonPlayback = catchAsync(async (req, res) => {
    const lessonId = req.params.lessonId;
    const data = await playbackService.getLessonPlayback(req.user.id, lessonId, req.user.email);
    return successResponse({
        res,
        data,
        message: 'Lesson playback authorized',
    });
});
//# sourceMappingURL=student-playback.controller.js.map