import { AppError } from '../../../utils/AppError.js';
const DEPRECATED = 'Cohort/class management has been removed. Use course purchases and live sessions instead.';
export const createClass = async (..._args) => {
    throw new AppError(DEPRECATED, 410);
};
export const updateClass = async (..._args) => {
    throw new AppError(DEPRECATED, 410);
};
export const deleteClass = async (..._args) => {
    throw new AppError(DEPRECATED, 410);
};
export const getAllClasses = async (..._args) => {
    throw new AppError(DEPRECATED, 410);
};
export const getClassById = async (..._args) => {
    throw new AppError(DEPRECATED, 410);
};
//# sourceMappingURL=admin-class.service.js.map