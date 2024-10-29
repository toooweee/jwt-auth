const ApiError = require('../exceptions/api-error');

module.exports = function (req, res, next) {
    try {
        const authorizationHeader = req.headers.authorization;
    } catch (e) {
        return next(ApiError.UnauthorizedError());
    }
}