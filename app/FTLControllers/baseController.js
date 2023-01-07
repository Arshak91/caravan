const Helper = require('../FTLClasses/helpersFTL');

module.exports = class BaseController {
    constructor() {
        this.helper = new Helper();
    }
    helper;
}