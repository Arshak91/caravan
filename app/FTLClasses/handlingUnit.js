const HandlingUnit = require("../newModels/handlingUnitModel");
const BaseService = require("./base");

module.exports = class HandlingUnitClass extends BaseService {
    constructor(params) {
        super();
        if (params) {
            this.data = params.data;
            this.where = params.where;
        }
        
    }
    async getAll(obj) {
        let handlingUnits, count;
        let { limit, offset, order } = obj.data;
        count = await HandlingUnit.countDocuments({...obj.where});
        handlingUnits = await HandlingUnit.find({...obj.where}).sort(order).limit(limit).skip(offset);
        return this.helper.getResponse(1, "ok", {handlingUnits, count});
    }
    async getOne(obj) {
        let handlingUnits;
        let { limit, offset, order } = obj.data;
        handlingUnits = await HandlingUnit.find({...obj.where}).sort(order).limit(limit).skip(offset);
        return this.helper.getResponse(1, "ok", handlingUnits);
    }
    async getAllWithoutPagination(obj) {
        let handlingUnits;
        handlingUnits = await HandlingUnit.find({...obj.where}).populate("images");
        return this.helper.getResponse(1, "ok", handlingUnits);
    }

    async create(obj) {
        let handlingUnit;
        handlingUnit = await HandlingUnit.create({
            ...obj.data
        });
        return this.helper.getResponse(1, "Successfully created", handlingUnit);
    }
    async update(obj) {
        let handlingUnit;
        handlingUnit = await HandlingUnit.findOneAndUpdate({...obj.where}, {
            ...obj.data
        }, {new: true}).catch(err => {
            console.log(err);
        });
        return this.helper.getResponse(1, "Successfully updated", handlingUnit);
    }
    async delete(obj) {
        let handlingUnits, message = "Successfully deleted", status = 1;
        handlingUnits = await HandlingUnit.deleteMany({...obj.where}, {
            ...obj.data
        }).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.helper.getResponse(status, message, handlingUnits);
    }
};
