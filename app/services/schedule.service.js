const Schedule = require("../newModels/scheduleModel");
const BaseService = require("../main_classes/base.service");

class ScheduleService extends BaseService {


    constructor(params) {
        super();
        if (params) {
            this.data = params.data;
            this.where = params.where;
        }
    }

    getAll = async (body) => {
        let pagination = await this.pagination.sortAndPagination(body.query)
        let fillter = await this.fillters.driverFilter(body.query)

        let schedules, count, message = "Schedules list", status = 1;
        let { limit, offset, order } = pagination;
        count = await Schedule.countDocuments({...fillter});
        schedules = await Schedule.find({...fillter}).sort(order).limit(limit).skip(offset).catch(async err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, {schedules, count});
    }
    getOne = async (where) => {
        let schedule, status = 1, message = "Success";
        schedule = await Schedule.findOne({...where}).catch(async err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        if (!schedule) {
            message = "such Schedule doesn't exist";
            status = 0;
        }
        return this.getResponse(status, message, schedule);
    }

    create = async (body) => {
        let schedule, message = "Schedule successfully created", status = 1;
        schedule = await Schedule.create({
            ...body
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
        return this.getResponse(status, message, schedule);
    }
    edit = async (body) => {
        let schedule, message = "Schedule successfully updated", status = 1;
        const { _id } = body;
        schedule = await Schedule.findByIdAndUpdate(_id, {
            ...body
        }).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        })
        if (!schedule) {
            message = "such Schedule doesn't updated";
            status = 0;
        }
        return this.getResponse(status, message, schedule);
    }

    delete = async (where) => {
        let schedules, message = "Schedule(s) successfully deleted", status = 1;
        schedules = await Schedule.deleteMany({
            ...where
        }).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        })
        if (!schedules) {
            message = "such Schedule(s) doesn't deleted";
            status = 0;
        }
        return this.getResponse(status, message, schedules);
    }
};

module.exports = ScheduleService;