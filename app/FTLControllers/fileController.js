const mime = require("mime");
const FileService = require("../services/file.service");
const FileServiceClass = new FileService();
const BaseController = require("../main_classes/base.controller");

class FileController extends BaseController {
    constructor() {
        super()
    };

    getFile = async (req, res) => {
        try {
            const result = await FileServiceClass.getFile(req);
            res.contentType(mime.getType(result.data.file));
            res.send(result.data.exFile)
        } catch (error) {
            this.errorHandler.requestError(res, `FileController/getAll: ${error.message}`);
        }
    };
}

module.exports = FileController = new FileController()