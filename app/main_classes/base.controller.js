const ErrorHandler = require('./error.handler');

module.exports = class BaseController {

    constructor() {
        this.errorHandler = new ErrorHandler();
    }

    errorHandler;
};