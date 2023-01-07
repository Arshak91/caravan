const FreightClassesService = require("../services/freightClass.service");
const FreightClassesServiceClass = new FreightClassesService();
const BaseController = require("../main_classes/base.controller");

class FreightClassController extends BaseController {
    constructor() {
        super()
    }

    getAll = async (req, res) => {
        try {
            const result = await FreightClassesServiceClass.getAll(req);
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, 'FreightClassController/getAll');
        }
    };

    create = async (req, res) => {
        try {
            const result = await FreightClassesServiceClass.create(req.body);
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, 'FreightClassController/create');
        }
    }
}

module.exports = FreightClassController = new FreightClassController()
