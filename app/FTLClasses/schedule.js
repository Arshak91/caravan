const Schedule = require("../newModels/scheduleModel");
const Check = require("../classes/checks");
const Helpers = require("../FTLClasses/helpersFTL");

module.exports = class scheduleClass {


    constructor(params) {
        this.data = params.data;
        this.where = params.where;
    }

    async getAll() {
        let schedules, count, message = "Schedules list", status = 1;
        let { limit, offset, order } = this.data;
        count = await Schedule.countDocuments({...this.where});
        schedules = await Schedule.find({...this.where}).sort(order).limit(limit).skip(offset).catch(async err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return await Helpers.getResponse(status, message, {schedules, count});
    }
    async getOne() {
        let schedule, status = 1, message = "Success";
        schedule = await Schedule.findOne({...this.where}).catch(async err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        if (!schedule) {
            message = "such Schedule doesn't exist";
            status = 0;
        }
        return await Helpers.getResponse(status, message, schedule);
    }

    async create() {
        let schedule, message = "Schedule successfully created", status = 1;
        schedule = await Schedule.create({
            ...this.data
        }).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        })
        if (!schedule) {
            message = "such Schedule doesn't created";
            status = 0;
        }
        return await Helpers.getResponse(status, message, schedule);
    }
};