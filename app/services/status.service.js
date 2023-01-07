const Statuses = require("../newModels/statusesModel");
const BaseService = require("../main_classes/base.service");

class StatusService extends BaseService {


    constructor(params) {
        super();
        if (params) {
            this.data = params.data;
            this.where = params.where;
        }
    }

    async getAll(body) {
        let statuses, message = "Statuses list", status = 1, count;
        let pagination = await this.pagination.sortAndPagination(body.query)
        let fillter = await this.fillters.statusFilter(body.query)
        let { limit, offset, order } = pagination;
        count = await Statuses.countDocuments({
            ...fillter
        });
        statuses = await Statuses.find({...fillter}).sort(order).limit(limit).skip(offset).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, {statuses, count});
    }
    async getOne(where) {
        let status, message = "Success", genStatus = 1;
        status = await Statuses.findOne({...where}).catch(err => {
            if (err) {
                message = err.message;
                genStatus = 0;
            }
        });
        return this.getResponse(genStatus, message, status);
    }

    getLoadStatuses = async () => {
        let status = 1, message = "Success";
        const where = {
            $or: [{type: "Both"},{type: "Load"}],
            statustype: "*",
        };
        const statuses = await Statuses.find(where).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, statuses);
    };

    getOrderStatuses = async () => {
        let status = 1, message = "Success";
        const where = {
            $or: [{type: "Both"},{type: "Order"}],
            statustype: "*",
        };

        const statuses = await Statuses.find(where).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, statuses);
    }
};

module.exports = StatusService;