const FlowtypeService = require("../services/flowtype.service");
const FlowtypeServiceClass = new FlowtypeService();
const BaseController = require("../main_classes/base.controller");

class FlowtypeController extends BaseController {
    constructor() {
        super()
    }

    getAll = async (req, res) => {
        try {
            const result = await FlowtypeServiceClass.getAll(req);
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, `FlowtypeController/getAll: ${error.message}`);
        }
    };

    create = async (req, res) => {
        try {
            const result = await FlowtypeServiceClass.create(req.body);
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, 'FlowtypeController/create');
        }
    }
}

module.exports = FlowtypeController = new FlowtypeController()
