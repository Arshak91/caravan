const SpecialNeedService = require("../services/specialNeeds.service");
const SpecialNeedServiceClass = new SpecialNeedService();
const BaseController = require("../main_classes/base.controller");

class SpecialNeedController extends BaseController {
    constructor() {
        super()
    }

    getAll = async (req, res) => {
        try {
            const result = await SpecialNeedServiceClass.getAll(req);
            res.json(result);
        } catch (error) {
            this.errorHandler.requestError(res, `SpecialNeedController/getAll: ${error.message}`);
        }
    };
    getById = async (req, res) => {
        try {
            const result = await SpecialNeedServiceClass.getById(req);
            res.json(result);
        } catch (error) {
            this.errorHandler.requestError(res, `SpecialNeedController/getOne: ${error.message}`);
        }
    };
    create = async (req, res) => {
        try {
            const result = await SpecialNeedServiceClass.create(req.body);
            res.json(result);
        } catch (error) {
            this.errorHandler.requestError(res, `SpecialNeedController/create: ${error.message}`);
        }
    };
    edit = async (req, res) => {
        try {
            const result = await SpecialNeedServiceClass.edit(req.body);
            res.json(result);
        } catch (error) {
            this.errorHandler.requestError(res, `SpecialNeedController/edit: ${error.message}`);
        }
    };
    delete = async (req, res) => {
        try {
            const result = await SpecialNeedServiceClass.delete(req);
            res.json(result);
        } catch (error) {
            this.errorHandler.requestError(res, `SpecialNeedController/delete: ${error.message}`);
        }
    }
}

module.exports = SpecialNeedController = new SpecialNeedController()