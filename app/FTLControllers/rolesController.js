const BaseController = require("../main_classes/base.controller");
const RoleService = require("../services/role.service")
const RoleServiceClass = new RoleService();

class RoleController extends BaseController {
    constructor() {
        super()
    }

    getAll = async (req, res) => {
        try {
            const result = await RoleServiceClass.getAll(req);
            return res.send(result);
        } catch (error) {
            this.errorHandler.requestError(res, `rolesController/getAll: ${error.message}`);
        }
    };
}

module.exports = RoleController = new RoleController();