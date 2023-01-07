const Permisions = require("../newModels/permisionsModel");
const Helpers = require("../FTLClasses/helpersFTL");

module.exports = class RoleClass {


    constructor(params) {
        this.data = params.data;
        this.where = params.where;
    }

    async getAll() {
        let permisions, message = "Permisions list", status = 1, count;
        let { limit, offset, order } = this.data;
        count = await Permisions.countDocuments({...this.where});
        permisions = await Permisions.find({}).sort(order).limit(limit).skip(offset).catch(async err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return await Helpers.getResponse(status, message, {permisions, count});
    }
    async getOne() {
        let permisions, message = "Permisions list", status = 1;
        permisions = await Permisions.findOne({...this.where}).catch(async err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return await Helpers.getResponse(status, message, permisions);
    }
};