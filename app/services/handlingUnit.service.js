const BaseService = require("../main_classes/base.service");
const HandlingUnit = require("../newModels/handlingUnitModel");

class HandlingUnitService extends BaseService {
    constructor(params) {
        super();
        if (params) {
            this.data = params.data;
            this.where = params.where;
        }
    }
    async getAll(data) {
        let { body } = data;
        let handlingUnits, count, message = "HandlinUnit List", status = 1;

        let pagination = await this.pagination.sortAndPagination(body)
        let fillter = await this.fillters.handlingunitFilter(body)

        let { limit, offset, order } = pagination;
        count = await HandlingUnit.countDocuments({...fillter});
        handlingUnits = await HandlingUnit.find({...fillter}).sort(order).limit(limit).skip(offset).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, {handlingUnits, count});
    }

    getById = async (data) => {
        let _id = data.params.id;
        let handlingUnit, message = "Success", status = 1;
        handlingUnit = await HandlingUnit.findById(_id).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        if (!handlingUnit) {
            status = 0;
            message = "such HandlingUnit doesn't exist!"
        }
        return this.getResponse(status, message, handlingUnit);
    }
    async getOne(where) {
        let handlingUnits;
        handlingUnits = await HandlingUnit.find({...where});
        return this.getResponse(1, "ok", handlingUnits);
    }
    async getAllWithoutPagination(obj) {
        let handlingUnits;
        handlingUnits = await HandlingUnit.find({...obj.where}).populate("images");
        return this.getResponse(1, "ok", handlingUnits);
    }

    async create(obj) {
        let handlingUnit;
        handlingUnit = await HandlingUnit.create({
            ...obj.data
        });
        return this.getResponse(1, "Successfully created", handlingUnit);
    }
    async update(obj) {
        let handlingUnit;
        handlingUnit = await HandlingUnit.findOneAndUpdate({...obj.where}, {
            ...obj.data
        }, {new: true}).catch(err => {
            console.log(err);
        });
        return this.getResponse(1, "Successfully updated", handlingUnit);
    }
    async delete(where) {
        let handlingUnits, message = "Successfully deleted", status = 1;
        handlingUnits = await HandlingUnit.deleteMany({...where}).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, handlingUnits);
    }
};

module.exports = HandlingUnitService;
