const ShiftService = require("../services/shift.service");
const ShiftServiceClass  = new ShiftService();
const BaseController = require("../main_classes/base.controller");


class ShiftController extends BaseController {
    constructor() {
        super()
    }

    getAll = async (req, res) => {
        try {
            const result = await ShiftServiceClass.getAll(req);
            return res.send(result);
        } catch (error) {
            this.errorHandler.requestError(res, `ShiftController/getAll: ${error.message}`);
        }
    };

    edit = async (req, res) => {
        try {
            const result = await ShiftServiceClass.edit(req);
            return res.send(result);
        } catch (error) {
            this.errorHandler.requestError(res, `ShiftController/edit: ${error.message}`);
        }
    }
}

module.exports = ShiftController = new ShiftController()
