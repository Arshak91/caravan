const BaseService = require("../main_classes/base.service");
const CZone = require("../newModels/czoneModel");


class CZoneService extends BaseService {
    constructor() {
        super();
    }

    getAll = async (data) => {
        let { body } = data;
        let pagination = await this.pagination.sortAndPagination(body)
        let fillter = await this.fillters.czoneFilter(body)
        let czones, message = "CZone list", status = 1, count;
        let { limit, offset, order } = pagination;
        count = await CZone.countDocuments({...fillter});
        czones = await CZone.find({...fillter}).sort(order).limit(limit).skip(offset).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, {czones, count});
    };

    getById = async (req) => {
        let _id = req.params.id;
        let czone, message = "Success", status = 1;
        czone = await CZone.findById(_id).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        if (!czone) {
            status = 0;
            message = "such czone doesn't exist!"
        }
        return this.getResponse(status, message, czone);
    }
    getOne = async (where) => {
        let czone, message = "Success", status = 1;
        czone = await CZone.findOne(where).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        if (!czone) {
            status = 0;
            message = "such czone doesn't exist!"
        }
        return this.getResponse(status, message, czone);
    }
    create = async (body) => {
        let czoneModel = {
            name: body.name,
            color: body.color
        };
        let status = 1, message = "czone created!";
        let czone = await CZone.create(czoneModel).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, czone);
    };

    edit = async (data) => {
        let where = { _id: data.body._id };
        let czoneModel = {
            name: data.body.name,
            color: data.body.color
        };
        let status = 1, message = "czone updated!";
        let czone = await CZone.findOneAndUpdate(where, czoneModel, {new: true}).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, czone);
    };

    delete = async (req) => {
        let ids = req.body.ids;
        let czone, message = "czone deleted!", status = 1;
        czone = await CZone.deleteMany({_id: {$in: ids}}).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        if (!czone) {
            status = 0;
            message = "such czone doesn't exist!"
        }
        return this.getResponse(status, message, czone);
    }
};

module.exports = CZoneService;