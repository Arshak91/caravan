const BaseService = require("../main_classes/base.service");
const SpecialNeeds = require("../newModels/specialNeedModel");


class SpecialNeedService extends BaseService {
    constructor() {
        super();
    }

    getAll = async (data) => {
        let { body } = data;
        let pagination = await this.pagination.sortAndPagination(body)
        let fillter = await this.fillters.specialneedFilter(body)
        let specialneeds, message = "SpecialNeed list", status = 1, count;
        let { limit, offset, order } = pagination;
        count = await SpecialNeeds.countDocuments({...fillter});
        specialneeds = await SpecialNeeds.find({...fillter}).sort(order).limit(limit).skip(offset).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, {specialneeds, count});
    };

    getById = async (req) => {
        let _id = req.params.id;
        let specialneed, message = "Success", status = 1;
        specialneed = await SpecialNeeds.findById(_id).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        if (!specialneed) {
            status = 0;
            message = "such specialneed doesn't exist!"
        }
        return this.getResponse(status, message, specialneed);
    }
    getOne = async (where) => {
        let specialneed, message = "Success", status = 1;
        specialneed = await SpecialNeeds.findOne(where).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        if (!specialneed) {
            status = 0;
            message = "such specialneed doesn't exist!"
        }
        return this.getResponse(status, message, specialneed);
    }
    create = async (body) => {
        let specialneedModel = {
            name: body.name,
            description: body.description,
            status: body.status
        };
        let status = 1, message = "specialneed created!";
        let specialneed = await SpecialNeeds.create(specialneedModel).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, specialneed);
    };

    edit = async (body) => {
        let where = { _id: body._id };
        let specialneedModel = {
            name: body.name,
            description: body.description,
            status: body.status
        };
        let status = 1, message = "specialneed updated!";
        let specialneed = await SpecialNeeds.findOneAndUpdate(where, specialneedModel, {new: true}).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, specialneed);
    };

    delete = async (req) => {
        let ids = req.body.ids;
        let specialneed, message = "specialneed deleted!", status = 1;
        specialneed = await SpecialNeeds.deleteMany({_id: {$in: ids}}).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        if (!specialneed) {
            status = 0;
            message = "such specialneed doesn't exist!"
        }
        return this.getResponse(status, message, specialneed);
    }
};

module.exports = SpecialNeedService;