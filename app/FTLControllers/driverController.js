const DriverService = require("../services/driver.service");
const DriverServiceClass = new DriverService();
const BaseController = require("../main_classes/base.controller");

class DriverController extends BaseController {
    constructor() {
        super();
    }
    checking = async (req, res) => {
        const x = await this.helper.checking();
        return res.send(x);
    }

    getAll = async (req, res) => {
        try {
            const result = await DriverServiceClass.getAll(req);
            return res.send(result);
        } catch (error) {
            this.errorHandler.requestError(res, 'DriverController/getAll');
        }
    };

    getById = async (req, res) => {
        try {
            const result = await DriverServiceClass.getById(req);
            return res.send(result);
        } catch (error) {
            this.errorHandler.requestError(res, `DriverController/getById: ${error.message}`);
        }
    }

    create = async (req, res) => {
        try {
            const result = await DriverServiceClass.create(req);
            return res.send(result);
        } catch (error) {
            this.errorHandler.requestError(res, `DriverController/create: ${error.message}`);
        }
    }

    quickCreate = async (req, res) => {
        try {
            const result = await DriverServiceClass.quickCreate(req);
            return res.send(result);
        } catch (error) {
            this.errorHandler.requestError(res, `DriverController/quickCreate: ${error.message}`);
        }
    }

    createUser = async (req, res) => {
        try {
            const result = await DriverServiceClass.activate(req);
            return res.send(result);
        } catch (error) {
            this.errorHandler.requestError(res, `DriverController/activate: ${error.message}`);
        }
    }
    edit = async (req, res) => {
        try {
            const result = await DriverServiceClass.update(req);
            return res.send(result);
        } catch (error) {
            this.errorHandler.requestError(res, `DriverController/update: ${error.message}`);
        }
    }

    delete = async (req, res) => {
        try {
            const result = await DriverServiceClass.delete(req.body);
            return res.send(result);
        } catch (error) {
            this.errorHandler.requestError(res, `DriverController/delete: ${error.message}`);
        }
    }
};

module.exports = DriverController = new DriverController();