const LocationType = require("../newModels/locationTypeModel");
const Check = require("../classes/checks");
const Helpers = require("./helpersFTL");

module.exports = class locationClass {


    constructor(params) {
        this.data = params.data;
        this.where = params.where;
    }

    async getAll() {
        let locationTypes, count, message = "locationTypes list", status = 1;
        let { limit, offset, order } = this.data;
        count = await LocationType.countDocuments({...this.where});
        locationTypes = await LocationType.find({...this.where}).sort(order).limit(limit).skip(offset).catch(async err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return await Helpers.getResponse(status, message, {locationTypes, count});
    }
    async getOne() {
        let locationType, status = 1, message = "Success";
        locationType = await LocationType.findOne({...this.where}).catch(async err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        if (!locationType) {
            message = "such Location doesn't exist";
            status = 0;
        }
        return await Helpers.getResponse(status, message, locationType);
    }

    async create() {
        let locationType, message = "Location successfully created", status = 1;
        locationType = await LocationType.create({
            ...this.data
        }).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        })
        return await Helpers.getResponse(status, message, locationType);
    }
};