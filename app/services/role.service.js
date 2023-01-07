const BaseService = require("../main_classes/base.service");
const Roles = require("../newModels/rolesModel");


class RoleService extends BaseService {
    constructor() {
        super();
    }

    getAll = async (body) => {
        let pagination = await this.pagination.sortAndPagination(body.query)
        let fillter = await this.fillters.roleFilter(body.query)
        let roles, message = "Roles list", status = 1, count;
        let { limit, offset, order } = pagination;
        count = await Roles.countDocuments({...fillter});
        roles = await Roles.find({...fillter}).sort(order).limit(limit).skip(offset).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, {roles, count});
    };
};

module.exports = RoleService;