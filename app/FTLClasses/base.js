const Helper = require('../FTLClasses/helpersFTL');

module.exports = class BaseService {
    constructor() {
        this.helper = new Helper();
    };
    helper;
};

