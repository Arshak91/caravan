const BaseService = require("../main_classes/base.service");
const FreightClassesModel = require("../newModels/freightClassesModel");


class FreightClassesService extends BaseService {
    constructor() {
        super();
    }

    getAll = async (body) => {
        let pagination = await this.pagination.sortAndPagination(body.query);
        let fillter = await this.fillters.FreightClassesFilter(body.query);
        let freightClasses, message = "FreightClasses list", status = 1, count;
        let { limit, offset, order } = pagination;
        count = await FreightClassesModel.countDocuments({...fillter});
        freightClasses = await FreightClassesModel.find({...fillter}).sort(order).limit(limit).skip(offset).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, {freightClasses, count});
    };
};

module.exports = FreightClassesService;