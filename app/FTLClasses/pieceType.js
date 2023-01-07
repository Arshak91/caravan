const PieceTypes = require("../newModels/pieceTypeModel");
const Check = require("../classes/checks");
const Helpers = require("../FTLClasses/helpersFTL");

module.exports = class RoleClass {


    constructor(params) {
        this.data = params.data;
        this.where = params.where;
    }

    async getAll() {
        let pieceTypes, message = "PieceTypes list", status = 1;
        let { limit, offset, order } = this.data;
        pieceTypes = await PieceTypes.find({...this.where}).sort(order).limit(limit).skip(offset).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return await Helpers.getResponse(status, message, pieceTypes);
    }

    async getOne() {
        let pieceType, message = "Success", status = 1;
        pieceType = await PieceTypes.findOne({...this.where}).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return await Helpers.getResponse(status, message, pieceType);
    }

    async create() {

    }
};