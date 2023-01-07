const Locations = require("../newModels/locationModel");
const Check = require("../classes/checks");
const Helpers = require("./helpersFTL");

module.exports = class locationClass {


    constructor(params) {
        this.data = params.data;
        this.where = params.where;
    }

    async getAll() {
        let locations, count, message = "locations list", status = 1;
        let { limit, offset, order } = this.data;
        count = await Locations.countDocuments({...this.where});
        locations = await Locations.find({...this.where}).sort(order).limit(limit).skip(offset).catch(async err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return await Helpers.getResponse(status, message, {locations, count});
    }
    async getOne() {
        let location, status = 1, message = "Success";
        location = await Locations.findOne({...this.where}).catch(async err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        if (!location) {
            message = "such Location doesn't exist";
            status = 0;
        }
        return await Helpers.getResponse(status, message, location);
    }

    async create() {
        let location, message = "Location successfully created", status = 1;
        location = await Locations.create({
            ...this.data
        }).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        })
        return await Helpers.getResponse(status, message, location);
    }
};