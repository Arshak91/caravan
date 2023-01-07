const BaseService = require("../main_classes/base.service");
const EquipmentTypes = require("../newModels/equipmentTypeModel");


class EquipmentTypeService extends BaseService {
    constructor() {
        super();
    }

    getAll = async (body) => {
        let pagination = await this.pagination.sortAndPagination(body.query);
        let fillter = await this.fillters.equipmentTypeFilter(body.query);
        let equipmentTypes, message = "EquipmentTypes list", status = 1, count;
        let { limit, offset, order } = pagination;
        count = await EquipmentTypes.countDocuments({...fillter});
        equipmentTypes = await EquipmentTypes.find({...fillter}).sort(order).limit(limit).skip(offset).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, {equipmentTypes, count});
    };
};

module.exports = EquipmentTypeService;