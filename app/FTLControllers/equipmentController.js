const EquipmentService = require("../services/equipment.service");
const EquipmentServiceClass = new EquipmentService();
const BaseController = require("../main_classes/base.controller");

class EquipmentController extends BaseController {
    constructor() {
        super()
    }

    getAll = async (req, res) => {
        try {
            const result = await EquipmentServiceClass.getAll(req);
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, `EquipmentController/getAll: ${error.message}`);
        }
    };

    getById = async (req, res) => {
        try {
            const result = await EquipmentServiceClass.getById(req);
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, `EquipmentController/getAll: ${error.message}`);
        }
    }

    create = async (req, res) => {
        try {
            const result = await EquipmentServiceClass.create(req.body);
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, `EquipmentController/create: ${error.message}`);
        }
    }

    edit = async (req, res) => {
        try {
            const result = await EquipmentServiceClass.edit(req.body);
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, `EquipmentController/edit: ${error.message}`);
        }
    }
    delete = async (req, res) => {
        try {
            const result = await EquipmentServiceClass.delete(req.body);
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, `EquipmentController/delete: ${error.message}`);
        }
    };
    updateTest = async (req, res) => {
        try {
            const result = await EquipmentServiceClass.updateTest(req);
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, `EquipmentController/updateTest: ${error.message}`);
        }
    }
}

module.exports = EquipmentController = new EquipmentController()
