const handlingTypeService = require("../services/handlingtypes.service");
const handlingTypeServiceClass = new handlingTypeService();
const BaseController = require("../main_classes/base.controller");

class handlingTypeController extends BaseController {
    constructor() {
        super()
    }

    getAll = async (req, res) => {
        try {
            const result = await handlingTypeServiceClass.getAll(req);
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, `handlingTypeController/getAll: ${error.message}`);
        }
    };

    getById = async (req, res) => {
        try {
            const result = await handlingTypeServiceClass.getById(req);
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, `handlingTypeController/getById: ${error.message}`);
        }
    };

    create = async (req, res) => {
        try {
            const result = await handlingTypeServiceClass.create(req.body);
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, `handlingTypeController/create: ${error.message}`);
        }
    }

    edit = async (req, res) => {
        try {
            const result = await handlingTypeServiceClass.update(req.body);
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, `handlingTypeController/edit: ${error.message}`);
        }
    }

    delete = async (req, res) => {
        try {
            const result = await handlingTypeServiceClass.delete(req.body);
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, `handlingTypeController/delete: ${error.message}`);
        }
    }
}

module.exports = handlingTypeController = new handlingTypeController()
