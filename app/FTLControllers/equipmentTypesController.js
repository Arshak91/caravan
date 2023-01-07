const EquipmentTypeService = require("../services/equipmentTypes.service");
const EquipmentTypeServiceClass = new EquipmentTypeService();
const BaseController = require("../main_classes/base.controller");

class EquipmentTypeController extends BaseController {
    constructor() {
        super()
    }

    getAll = async (req, res) => {
        try {
            const result = await EquipmentTypeServiceClass.getAll(req);
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, 'EquipmentTypeController/getAll');
        }
    };

    create = async (req, res) => {
        try {
            const result = await EquipmentTypeServiceClass.create(req.body);
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, 'EquipmentTypeController/create');
        }
    }
}

module.exports = EquipmentTypeController = new EquipmentTypeController()
