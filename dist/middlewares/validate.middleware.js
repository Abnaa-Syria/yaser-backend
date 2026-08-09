import { catchAsync } from '../utils/catchAsync.js';
export const validate = (schema) => {
    return catchAsync(async (req, res, next) => {
        const result = await schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        // Assign back parsed/transformed values safely
        if (result.body)
            Object.assign(req.body, result.body);
        if (result.query)
            Object.assign(req.query, result.query);
        if (result.params)
            Object.assign(req.params, result.params);
        next();
    });
};
//# sourceMappingURL=validate.middleware.js.map