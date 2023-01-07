const BaseService = require("../main_classes/base.service");
const PieceTypes = require("../newModels/pieceTypeModel");


class PieceTypeServie extends BaseService {
    constructor() {
        super()
    }

    getAll = async (body) => {
        let pagination = await this.pagination.sortAndPagination(body.query)
        let fillter = await this.fillters.pieceTypeFilter(body.query)

        let pieceTypes, count, message = "PieceType list", status = 1;
        let { limit, offset, order } = pagination;
        count = await PieceTypes.countDocuments({
            ...fillter
        });
        pieceTypes = await PieceTypes.find({
            ...fillter
        }).populate("products").populate("status").sort(order).limit(limit).skip(offset).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, {pieceTypes, count});
    }

    async getOne(where) {
        let pieceType, message = "Success", status = 1;
        pieceType = await PieceTypes.findOne({...where}).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, pieceType);
    }
}

module.exports = PieceTypeServie;