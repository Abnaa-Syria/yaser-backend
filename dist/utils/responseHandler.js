export const successResponse = ({ res, data = {}, message = 'Operation successful', statusCode = 200, results, meta, }) => {
    return res.status(statusCode).json({
        success: true,
        message,
        results,
        meta,
        data,
    });
};
//# sourceMappingURL=responseHandler.js.map