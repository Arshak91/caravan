const Permisions = require("../newModels/permisionsModel");
const Settings = require("../newModels/settingsModel");
const BaseService = require("../main_classes/base.service");

class PermisionService extends BaseService {


    constructor(params) {
        super();
        if (params) {
            this.data = params.data;
            this.where = params.where;
        }
    }

    getAll = async (body) => {
        let permisions, message = "Permisions list", status = 1, count;
        let pagination = await this.pagination.sortAndPagination(body.query)
        let fillter = await this.fillters.permisionFilter(body.query)

        let { limit, offset, order } = pagination;
        count = await Permisions.countDocuments({...fillter});
        permisions = await Permisions.find({...fillter}).sort(order).limit(limit).skip(offset).catch(async err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, {permisions, count});
    }
    getOne = async (where) => {
        let permisions, message = "Permisions list", status = 1;
        permisions = await Permisions.findOne({...where}).catch(async err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, permisions);
    }
    checkPermisions = async (data) => {
        let userId = data.user._id, settings, permision;
        let url;
        if (!data.params.id) {
            url = data.url.split("?")[0];
        } else {
            const len = data.url.split("?")[0].split('/').length;
            const substrings = data.url.split("?")[0].split('/',len-1);
            url = substrings.join("/")
        }
        settings = await Settings.findOne({user: userId});
        permision = await Permisions.findOne({
            "url": url,
            "method": data.method.toLowerCase()
        });
        let userPermisions = settings.get("permisions"),
        usedPermision = permision ? permision.get("number") : null,
        userPermisionConfig = settings.get("permisionConfig");
        if (data.user.role.name == "ADMIN") {
            return false
        } else if (userPermisionConfig || userPermisions.includes(usedPermision)) {
            return false
        }else {
            return this.getResponse(0, "permision danied");
        }
    }
};

module.exports = PermisionService;