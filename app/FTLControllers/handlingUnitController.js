const HandlingUnitService = require("../services/handlingUnit.service");
const HandlingUnitServiceClass = new HandlingUnitService();
const BaseController = require("../main_classes/base.controller");

class HandlingunitController extends BaseController {
    constructor() {
        super()
    }

    getAll = async (req, res) => {
        try {
            const result = await HandlingUnitServiceClass.getAll(req);
            res.json(result);
        } catch (error) {
            this.errorHandler.requestError(res, 'HandlingunitController/getAll');
        }
    };

    getById = async (req, res) => {
        try {
            let handligUnitId = req.params.id;
            const result = await HandlingUnitServiceClass.getById({_id: handligUnitId});
            res.json(result);
        } catch (error) {
            this.errorHandler.requestError(res, 'HandlingunitController/getById');
        }
    }

    getOne = async (req, res) => {
        try {
            let handligUnitId = req.params.id;
            const result = await HandlingUnitServiceClass.getOne({_id: handligUnitId});
            res.json(result);
        } catch (error) {
            this.errorHandler.requestError(res, 'HandlingunitController/getOne');
        }
    }
}

module.exports = HandlingunitController = new HandlingunitController();