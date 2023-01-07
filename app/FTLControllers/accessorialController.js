const AccessorialService= require("../services/accessorial.service");
const AccessorialServiceClass = new AccessorialService();
const BaseController = require("../main_classes/base.controller");

class AccessorialController extends BaseController {
    constructor() {
        super();
    }

    getAll = async (req, res) => {
        try {
            const result = await AccessorialServiceClass.getAll(req);
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, 'AccessorialController/getAll');
        }
    };

    getOne = async (req, res) => {
        try {
            const result = await AccessorialServiceClass.getOne(req.query);
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, 'AccessorialController/getAll');
        }
    };

    create = async (req, res) => {
        try {
            const result = await AccessorialServiceClass.create(req.body);
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, 'AccessorialController/create');
        }
    }
}

module.exports = AccessorialController = new AccessorialController();
