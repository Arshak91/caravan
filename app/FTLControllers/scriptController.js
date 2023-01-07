const ScriptService = require("../services/script.service");
const ScriptServiceClass  = new ScriptService();
const BaseController = require("../main_classes/base.controller");

class ScriptController extends BaseController {
    constructor() {
        super()
    }

    script = async (req, res) => {
        try {
            const result = await ScriptServiceClass.update();
            return res.send(result);
        } catch (error) {
            this.errorHandler.requestError(res, `ScriptController/script: ${error.message}`);
        }
    }
}

module.exports = ScriptController = new ScriptController()