const StatusService = require("../services/status.service");
const StatusServiceClass  = new StatusService();
const BaseController = require("../main_classes/base.controller");


class StatusController extends BaseController {
    constructor() {
        super()
    }

    getAll = async (req, res) => {
        try {
            const result = await StatusServiceClass.getAll(req);
            return res.send(result);
        } catch (error) {
            this.errorHandler.requestError(res, `StatusController/getAll: ${error.message}`);
        }
    };

    getLoadStatuses = async (req, res) => {
        try {
            const result = await StatusServiceClass.getLoadStatuses(req);
            return res.send(result);
        } catch (error) {
            this.errorHandler.requestError(res, `StatusController/getLoadStatuses: ${error.message}`);
        }
    };

    getOrderStatuses = async (req, res) => {
        try {
            const result = await StatusServiceClass.getOrderStatuses(req);
            return res.send(result);
        } catch (error) {
            this.errorHandler.requestError(res, `StatusController/getOrderStatuses: ${error.message}`);
        }
    }
}

module.exports = StatusController = new StatusController()
