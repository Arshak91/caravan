const PieceTypeService = require("../services/pieceType.service");
const PieceTypeServiceClass  = new PieceTypeService();
const BaseService = require("../main_classes/base.controller");


class PieceTypeController extends BaseService {
    constructor() {
        super()
    }

    getAll = async (req, res) => {
        try {
            const result = await PieceTypeServiceClass.getAll(req);
            return res.send(result);
        } catch (error) {
            this.errorHandler.requestError(res, 'PieceTypeController/getAll');
        }
    };
}

module.exports = PieceTypeController = new PieceTypeController();
