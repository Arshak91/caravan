const notificationService = require("../services/notifications.service");
const notificationServiceClass = new notificationService();
const BaseController = require("../main_classes/base.controller");

class notificationController extends BaseController {
    constructor() {
        super()
    }

    getAll = async (req, res) => {
        try {
            const result = await notificationServiceClass.getAll(req);
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, `notificationController/getAll: ${error.message}`);
        }
    };

    getById = async (req, res) => {
        try {
            const result = await notificationServiceClass.getById(req);
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, `notificationController/getById: ${error.message}`);
        }
    };

    create = async (req, res) => {
        try {
            const result = await notificationServiceClass.create(req.body);
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, `notificationController/create: ${error.message}`);
        }
    }

    edit = async (req, res) => {
        try {
            const result = await notificationServiceClass.update(req.body);
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, `notificationController/create: ${error.message}`);
        }
    }

    seen = async (req, res) => {
        try {
            const result = await notificationServiceClass.seen(req);
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, `notificationController/seen: ${error.message}`);
        }
    }

    setAllNotificationSeen = async (req, res) => {
        try {
            const result = await notificationServiceClass.setAllNotificationSeen(req);
        return res.send(result);
        } catch (error) {
            this.errorHandler.requestError(res, `notificationController/setAllNotificationSeen: ${error.message}`);
        }
    };

    delete = async (req, res) => {
        try {
            const result = await notificationServiceClass.delete(req.body);
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, `notificationController/create: ${error.message}`);
        }
    }
}

module.exports = notificationController = new notificationController()
