const BaseService = require("../main_classes/base.service");
const Flowtype = require("../newModels/flowtypeModel");


class FlowtypeService extends BaseService {
    constructor() {
        super();
    }

    getAll = async (body) => {
        let pagination = await this.pagination.sortAndPagination(body.query);
        let fillter = await this.fillters.flowtypeFilter(body.body);
        let flowtypes, message = "Flowtype list", status = 1, count;
        let { limit, offset, order } = pagination;
        count = await Flowtype.countDocuments({
            ...fillter,
            status: 1
        });
        flowtypes = await Flowtype.find({
            ...fillter,
            status: 1
        }).sort(order).limit(limit).skip(offset).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, {flowtypes, count});
    };
};

module.exports = FlowtypeService;