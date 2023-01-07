const Statuses = require("../newModels/statusesModel");
const Helpers = require("../FTLClasses/helpersFTL");

module.exports = class RoleClass {


    constructor(params) {
        this.data = params.data;
        this.where = params.where;
    }

    async getAll() {
        let statuses, message = "Statuses list", status = 1;
        let { limit, offset, order } = this.data;
        statuses = await Statuses.find({...this.where}).sort(order).limit(limit).skip(offset).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return await Helpers.getResponse(status, message, statuses);
    }
};