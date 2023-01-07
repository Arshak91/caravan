const CZoneService = require("../services/czone.service");
const CZoneServiceClass = new CZoneService();
const BaseController = require("../main_classes/base.controller");

class CZoneController extends BaseController {
    constructor() {
        super()
    }

    getAll = async (req, res) => {
        try {
            const result = await CZoneServiceClass.getAll(req);
            res.json(result);
        } catch (error) {
            this.errorHandler.requestError(res, `CZoneController/getAll: ${error.message}`);
        }
    };
    getById = async (req, res) => {
        try {
            const result = await CZoneServiceClass.getById(req);
            res.json(result);
        } catch (error) {
            this.errorHandler.requestError(res, `CZoneController/getOne: ${error.message}`);
        }
    };
    create = async (req, res) => {
        try {
            const result = await CZoneServiceClass.create(req.body);
            res.json(result);
        } catch (error) {
            this.errorHandler.requestError(res, `CZoneController/create: ${error.message}`);
        }
    };
    edit = async (req, res) => {
        try {
            const result = await CZoneServiceClass.edit(req);
            res.json(result);
        } catch (error) {
            this.errorHandler.requestError(res, `CZoneController/edit: ${error.message}`);
        }
    };
    delete = async (req, res) => {
        try {
            const result = await CZoneServiceClass.delete(req);
            res.json(result);
        } catch (error) {
            this.errorHandler.requestError(res, `CZoneController/delete: ${error.message}`);
        }
    }
}

module.exports = CZoneController = new CZoneController()