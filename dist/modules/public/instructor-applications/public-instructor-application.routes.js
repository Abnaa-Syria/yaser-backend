import { Router } from 'express';
import { validate } from '../../../middlewares/validate.middleware.js';
import { instructorCvUpload } from '../../../middlewares/instructorCvUpload.middleware.js';
import * as controller from './public-instructor-application.controller.js';
import * as validation from './public-instructor-application.validation.js';
const router = Router();
router.post('/cv', instructorCvUpload.single('cv'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ status: 'fail', message: 'CV file is required' });
    }
    return res.status(201).json({
        status: 'success',
        data: { url: `/uploads/instructor-cvs/${req.file.filename}` },
    });
});
router.post('/', validate(validation.submitInstructorApplicationSchema), controller.submitInstructorApplication);
export default router;
//# sourceMappingURL=public-instructor-application.routes.js.map