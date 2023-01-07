const DepoService = require("../services/depo.service");
const DepoServiceClass = new DepoService();
const BaseController = require("../main_classes/base.controller");

class DepoController extends BaseController {
    constructor() {
        super()
    }

    getAll = async (req, res) => {
        try {
            const result = await DepoServiceClass.getAll(req);
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, `DepoController/getAll: ${error.message}`);
        }
    };

    getById = async (req, res) => {
        try {
            const result = await DepoServiceClass.getById(req);
            res.json(result);
        } catch (error) {
            this.errorHandler.requestError(res, `DepoController/getById: ${error.message}`);
        }
    };

    create = async (req, res) => {
        try {
            const result = await DepoServiceClass.create(req.body);
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, `DepoController/create: ${error.message}`);
        }
    };

    edit = async (req, res) => {
        try {
            const result = await DepoServiceClass.edit(req);
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, `DepoController/edit: ${error.message}`);
        }
    };

    delete = async (req, res) => {
        try {
            const result = await DepoServiceClass.delete(req);
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, `DepoController/delete: ${error.message}`);
        }
    }
}

module.exports = DepoController = new DepoController()
