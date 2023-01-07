const BaseService = require("../main_classes/base.service");
const Accessorials = require("../newModels/accessorialModel");

class AccessorialService extends BaseService {


    constructor(params) {
        super();
        if (params) {
            this.data = params.data;
            this.where = params.where;
        }
    }

    async getAll(body) {
        let accessorials, count, message = "Accessorials list", status = 1;

        let pagination = await this.pagination.sortAndPagination(body.query)
        let fillter = await this.fillters.locationTypeFilter(body.query)

        let { limit, offset, order } = pagination;
        count = await Accessorials.countDocuments({...fillter});
        accessorials = await Accessorials.find({...fillter}).sort(order).limit(limit).skip(offset).catch(async err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, {accessorials, count});
    }
    async getOne(where) {
        let accessorial, status = 1, message = "Success";
        accessorial = await Accessorials.findOne({...where}).catch(async err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        if (!accessorial) {
            message = "such Accessorial doesn't exist";
            status = 0;
        }
        return this.getResponse(status, message, accessorial);
    }

    async create(body) {
        let accessorial, message = "Accessorial successfully created", status = 1;
        accessorial = await Accessorials.create({
            ...body
        }).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        })
        if (!accessorial) {
            message = "Accessorial doesn't created";
            status = 0;
        }
        return this.getResponse(status, message, accessorial);
    }
};

module.exports = AccessorialService;