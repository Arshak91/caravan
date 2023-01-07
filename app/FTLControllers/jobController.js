const JobService = require("../services/job.service");
const JobServiceClass = new JobService();
const BaseController = require("../main_classes/base.controller");

class JobController extends BaseController {
    constructor() {
        super()
    }

    getAll = async (req, res) => {
        try {
            const result = await JobServiceClass.getAll(req);
            res.json(result);
        } catch (error) {
            this.errorHandler.requestError(res, 'JobController/getAll');
        }
    };

    getById = async (req, res) => {
        try {
            const result = await JobServiceClass.getById(req);
            res.json(result);
        } catch (error) {
            this.errorHandler.requestError(res, 'JobController/getById');
        }
    };

    status = async (req, res) => {
        try {
            const result = await JobServiceClass.getStatus(req);
            res.json(result);
        } catch (error) {
            this.errorHandler.requestError(res, `JobController/status: ${error.message}`);
        }
    };

    delete = async (req, res) => {
        try {
            const result = await JobServiceClass.delete(req);
            res.json(result);
        } catch (error) {
            this.errorHandler.requestError(res, `JobController/delete: ${error.message}`);
        }
    }
}

module.exports = JobController = new JobController()