const Drivers = require("../newModels/driverModel");
const BaseService = require("./base");

module.exports = class DriverClass extends BaseService {


    constructor(params) {
        super();
        if (params) {
            this.data = params.data;
            this.where = params.where;
        }
    }

    async getAll(obj) {
        let drivers, count, message = "Drivers list", status = 1;
        let { limit, offset, order } = obj.data;
        count = await Drivers.countDocuments({...obj.where});
        drivers = await Drivers.find({...obj.where}).sort(order).limit(limit).skip(offset).catch(async err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.helper.getResponse(status, message, {drivers, count});
    }
    async getOne(obj) {
        let driver, status = 1, message = "Success";
        driver = await Drivers.findOne({...obj.where}).catch(async err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        if (!driver) {
            message = "such Driver doesn't exist";
            status = 0;
        }
        return this.helper.getResponse(status, message, driver);
    }

    async create(obj) {
        let driver, message = "Driver successfully created", status = 1;
        driver = await Drivers.create({
            ...obj.data
        }).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        })
        if (!driver) {
            message = "Driver doesn't created";
            status = 0;
        }
        return this.helper.getResponse(status, message, driver);
    }

    async update(obj) {
        let driver, message = "Driver successfully updated", status = 1;
        driver = await Drivers.findOneAndUpdate({...obj.where}, {
            ...obj.data
        }, {new: true}).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        })
        if (!driver) {
            message = "Driver doesn't updated";
            status = 0;
        }
        return this.helper.getResponse(status, message, driver);
    }
};