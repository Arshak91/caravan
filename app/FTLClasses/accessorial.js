const Accessorials = require("../newModels/accessorialModel");
const BaseService = require("./base");

module.exports = class accessorialClass extends BaseService {


    constructor(params) {
        super();
        if (params) {
            this.data = params.data;
            this.where = params.where;
        }
    }

    async getAll(obj) {
        let accessorials, count, message = "Accessorials list", status = 1;
        let { limit, offset, order } = this.data;
        count = await Accessorials.countDocuments({...obj.where});
        accessorials = await Accessorials.find({...obj.where}).sort(order).limit(limit).skip(offset).catch(async err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.helper.getResponse(status, message, {accessorials, count});
    }
    async getOne(obj) {
        let accessorial, status = 1, message = "Success";
        accessorial = await Accessorials.findOne({...obj.where}).catch(async err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        if (!accessorial) {
            message = "such Accessorial doesn't exist";
            status = 0;
        }
        return this.helper.getResponse(status, message, accessorial);
    }

    async create(obj) {
        let accessorial, message = "Accessorial successfully created", status = 1;
        accessorial = await Accessorials.create({
            ...obj.data
        }).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        })
        return this.helper.getResponse(status, message, accessorial);
    }
};