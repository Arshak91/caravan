module.exports = class ErrorHandler {
    requestError = (res, msg) => (res.status(500).send({ status: 0, msg: `Something went wrong in ${msg}` }));
};