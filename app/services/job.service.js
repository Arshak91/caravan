const BaseService = require("../main_classes/base.service");
const Jobs = require("../newModels/jobModel");


class JobService extends BaseService {
    constructor() {
        super();
    }

    getAll = async (data) => {
        let { body } = data;
        let pagination = await this.pagination.sortAndPagination(body)
        let fillter = await this.fillters.jobFilter(body)
        let jobs, message = "Job list", status = 1, count;
        let { limit, offset, order } = pagination;
        count = await Jobs.countDocuments({...fillter});
        jobs = await Jobs.find({...fillter}, "createdAt params totalRunTime loadsCount status totalDistance InfeasibleCount").sort(order).limit(limit).skip(offset).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, {jobs, count});
    };

    getOne = async (where) => {
        let job, message = "Success", status = 1;
        job = await Jobs.findOne({...where}).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        if (!job) {
            status = 0;
            message = "such Job doesn't exist!"
        }
        return this.getResponse(status, message, job);
    }

    getById = async (data) => {
        let _id = data.params.id;
        let job, message = "Success", status = 1;
        job = await Jobs.findById(_id).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        if (!job) {
            status = 0;
            message = "such Jobs doesn't exist!"
        }
        return this.getResponse(status, message, job);
    };

    getStatus = async (data) => {
        let { uuid } = data.body;
        let job, message = "Success", status = 1;
        job = await Jobs.findOne({ UUID: uuid }, "status").catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        if (!job) {
            status = 0;
            message = "such Job doesn't exist!"
        }
        return this.getResponse(status, message, job);
    }
    create = async (body) => {
        let status = 1, message = "Success";
        let job = await Jobs.create(body).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, job);
    };

    edit = async (body, uuid) => {
        let status = 1, message = "Success";
        let job = await Jobs.findOneAndUpdate({UUID: uuid}, body, {new: true}).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, job);
    };

    delete = async (data) => {
        let { ids } = data.body, status = 1, message = "Job(s) successfully deleted";
        const jobs = await Jobs.deleteMany({
            _id: {
                $in: ids
            }
        }).catch(err => {
            if (err) {
                message = err.message;
                status = 0
            }
        });
        return this.getResponse(status, message, jobs)
    }

    save = async (job) => {
        await Jobs.findByIdAndUpdate(job._id, job);
    };
};

module.exports = JobService;