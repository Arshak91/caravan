const transportTypeService = require("../services/transportType.service");
const transportTypeServiceClass = new transportTypeService();
const BaseController = require("../main_classes/base.controller");

class transportTypeController extends BaseController {
    constructor() {
        super()
    }

    getAll = async (req, res) => {
        try {
            const result = await transportTypeServiceClass.getAll(req);
            res.json(result);
        } catch (error) {
            this.errorHandler.requestError(res, `transportTypeController/getAll: ${error.message}`);
        }
    };
    getById = async (req, res) => {
        try {
            const result = await transportTypeServiceClass.getById(req);
            res.json(result);
        } catch (error) {
            this.errorHandler.requestError(res, `transportTypeController/getOne: ${error.message}`);
        }
    };
    create = async (req, res) => {
        try {
            const result = await transportTypeServiceClass.create(req.body);
            res.json(result);
        } catch (error) {
            this.errorHandler.requestError(res, `transportTypeController/create: ${error.message}`);
        }
    };
    edit = async (req, res) => {
        try {
            const result = await transportTypeServiceClass.edit(req);
            res.json(result);
        } catch (error) {
            this.errorHandler.requestError(res, `transportTypeController/edit: ${error.message}`);
        }
    };
    delete = async (req, res) => {
        try {
            const result = await transportTypeServiceClass.delete(req);
            res.json(result);
        } catch (error) {
            this.errorHandler.requestError(res, `transportTypeController/delete: ${error.message}`);
        }
    }
}

module.exports = transportTypeController = new transportTypeController()