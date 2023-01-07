const LocationTypeService = require("../services/locatioType.service");
const LocationTypeServiceClass = new LocationTypeService();
const BaseController = require("../main_classes/base.controller");


class LocatioTypeController extends BaseController {
    constructor() {
        super()
    }

    getAll = async (req, res) => {
        try {
            const result = await LocationTypeServiceClass.getAll(req)
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, 'LocatioTypeController/getAll');
        }
    };

    create = async (req, res) => {
        try {
            const result = await LocationTypeServiceClass.create(req.body)
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, 'LocatioTypeController/create');
        }
    }
}

module.exports = LocatioTypeController = new LocatioTypeController();