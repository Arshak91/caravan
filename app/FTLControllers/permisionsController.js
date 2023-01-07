const PermisionService = require("../services/permision.service");
const PermisionServiceClass = new PermisionService();
const BaseController = require("../main_classes/base.controller");

class PermisionController extends BaseController {
    constructor() {
        super()
    }

    getAll = async (req, res) => {
        try {
            const result = await PermisionServiceClass.getAll(req);
            res.json(result);
        } catch (error) {
            this.errorHandler.requestError(res, 'PermisionController/getAll');
        }
    };

    checkPermisions = async (req, res, next) => {
        try {
            const result = await PermisionServiceClass.checkPermisions(req);
            if(result && !result.status){
                res.json(result);
            } else {
                next()
            }
        } catch (error) {
            this.errorHandler.requestError(res, `PermisionController/checkPermisions: ${error.message}`);
        }
    }
}

module.exports = PermisionController = new PermisionController()