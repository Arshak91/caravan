const BaseService = require("../main_classes/base.service");
const TransportType = require("../newModels/transportTypeModel");


class TransportTypeSercie extends BaseService {
    constructor() {
        super();
    }

    getAll = async (data) => {
        let { body } = data;
        let pagination = await this.pagination.sortAndPagination(body)
        let fillter = await this.fillters.transportTypeFilter(body)
        let transportTypes, message = "transportType list", status = 1, count;
        let { limit, offset, order } = pagination;
        count = await TransportType.countDocuments({...fillter});
        transportTypes = await TransportType.find({...fillter}).sort(order).limit(limit).skip(offset).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, {transportTypes, count});
    };

    getById = async (req) => {
        let _id = req.params.id;
        let transportType, message = "Success", status = 1;
        transportType = await TransportType.findById(_id).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        if (!transportType) {
            status = 0;
            message = "such transportType doesn't exist!"
        }
        return this.getResponse(status, message, transportType);
    }
    getOne = async (where) => {
        let transportType, message = "Success", status = 1;
        transportType = await TransportType.findOne(where).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        if (!transportType) {
            status = 0;
            message = "such transportType doesn't exist!"
        }
        return this.getResponse(status, message, transportType);
    }
    create = async (body) => {
        let transportTypeModel = {
            name: body.name,
            index: body.index,
            description: body.description,
            status: body.status
        };
        let status = 1, message = "transportType created!";
        let transportType = await TransportType.create(transportTypeModel).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, transportType);
    };

    edit = async (data) => {
        let where = { _id: data.body._id };
        let transportTypeModel = {
            name: data.body.name,
            index: data.body.index,
            description: data.body.description,
            status: data.body.status
        };
        let status = 1, message = "transportType updated!";
        let transportType = await TransportType.findOneAndUpdate(where, transportTypeModel, {new: true}).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, transportType);
    };

    delete = async (req) => {
        let ids = req.body.ids;
        let transportType, message = "transportType deleted!", status = 1;
        transportType = await TransportType.deleteMany({_id: { $in: ids } }).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        if (!transportType) {
            status = 0;
            message = "such transportType doesn't exist!"
        }
        return this.getResponse(status, message, transportType);
    }
};

module.exports = TransportTypeSercie;