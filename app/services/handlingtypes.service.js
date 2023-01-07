const BaseService = require("../main_classes/base.service");
const HandlingType = require("../newModels/handlingTypeModel");
const HandlingTypeHelpers = require("../helpers/handlingtypeHelpers");
const HandlingTypeHelpersClass = new HandlingTypeHelpers();

class HandlingTypeService extends BaseService {
    constructor(params) {
        super();
        if (params) {
            this.data = params.data;
            this.where = params.where;
        }
    }
    getAll = async (body) => {
        let handlingTypes, count, message = "HandlingType List", status = 1;

        let pagination = await this.pagination.sortAndPagination(body.body)
        let fillter = await this.fillters.HandlingTypeFilter(body.body)

        let { limit, offset, order } = pagination;
        count = await HandlingType.countDocuments({...fillter});
        handlingTypes = await HandlingType.find({...fillter}).sort(order).limit(limit).skip(offset).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, {handlingTypes, count});
    }
    getOne = async (where) => {
        let handlingTypes;
        handlingTypes = await HandlingType.findOne({...where});
        return this.getResponse(1, "ok", handlingTypes);
    }

    getById = async (req) => {
        let handlingTypes, _id = req.params.id;
        handlingTypes = await HandlingType.findById(_id);
        return this.getResponse(1, "ok", handlingTypes);
    }

    getAllWithoutPagination = async (obj) => {
        let handlingTypes;
        handlingTypes = await HandlingType.find({...obj.where}).populate("images");
        return this.getResponse(1, "ok", handlingTypes);
    }

    create = async (obj) => {
        let handlingType;
        const handlingTypeModel = await HandlingTypeHelpersClass.getHandlingtypeModel(obj)
        handlingType = await HandlingType.create({
            ...handlingTypeModel
        });
        return this.getResponse(1, "Successfully created", handlingType);
    }
    update = async (obj) => {
        let handlingType;
        const handlingTypeModel = await HandlingTypeHelpersClass.getHandlingtypeModel(obj)
        const _id = obj._id;
        handlingType = await HandlingType.findOneAndUpdate({_id}, {
            ...handlingTypeModel
        }, {new: true}).catch(err => {
            console.log(err);
        });
        return this.getResponse(1, "Successfully updated", handlingType);
    }
    delete = async (body) => {
        let { ids } = body;
        let handlingTypes, message = "Successfully deleted", status = 1;
        handlingTypes = await HandlingType.deleteMany({
            _id: {
                $in: ids
            }
        }).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, handlingTypes);
    }
};

module.exports = HandlingTypeService;
