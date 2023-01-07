const BaseController = require("../main_classes/base.controller");

const MathService = require("../services/math.service");
const MathServiceClass = new MathService();


class MathController extends BaseController {
    constructor() {
        super()
    }

    execute = async (req, res) => {
        try {
            const result = await MathServiceClass.execute(req);
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, `MathController/execute: ${error.message}`);
        }
    };

    executeTime = async (req, res) => {
        try {
            const result = await MathServiceClass.executeFTL(req);
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, `MathController/executeTime: ${error.message}`);
        }
    };

    cancel = async (req, res) => {
        try {
            const result = await MathServiceClass.cancel(req);
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, `MathController/cancel: ${error.message}`);
        }
    }

    handleError = async (req, res) => {
        try {
            const result = await MathServiceClass.handleError(req.body);
            res.json(result);
        } catch (error) {
            this.errorHandler.requestError(res, `MathController/handleError: ${error.message}`);
        }
    };
}

module.exports = MathController = new MathController();