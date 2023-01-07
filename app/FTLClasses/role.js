const Roles = require("../newModels/rolesModel");
const Check = require("../classes/checks");
const Helpers = require("../FTLClasses/helpersFTL");

module.exports = class RoleClass {


    constructor(params) {
        this.data = params.data;
        this.where = params.where;
    }

    async getAll() {
        let roles, message = "Roles list", status = 1;
        let { limit, offset, order } = this.data;
        roles = await Roles.find({...this.where}).sort(order).limit(limit).skip(offset).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return await Helpers.getResponse(status, message, roles);
    }
};