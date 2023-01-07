const BaseController = require("../main_classes/base.controller");
const UploadService = require("../services/upload.service");
const UploadServiceClass = new UploadService();

class UploadController extends BaseController {

    constructor() {
        super()
    }

    getAll = async (req, res) => {
        try {
            const result = await UploadServiceClass.getAll(req);
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, `UploadController/getAll: ${error.message}`);
        }
    };

    getOne = async (req, res) => {
        try {
            const result = await UploadServiceClass.getOne(req.query);
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, `UploadController/getOne: ${error.message}`);
        }
    };
    getByUUID = async (req, res) => {
        try {
            const result = await UploadServiceClass.getByUUID(req);
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, `UploadController/getByUUID: ${error.message}`);
        }
    };

    getOneStatus = async (req, res) => {
        try {
            const result = await UploadServiceClass.getOne(req.query);
            let data = {
                Finished: result.data.status == 2 || result.data.status == 0 ? true : false,
                Running: result.data.status == 1 ? true : false,
                msg: result.data.status == 2 || result.data.status == 0 ? `created ${result.data.orderCount} orders. ` : "Please Continue!",
                upload: result.data.status == 2 || result.data.status == 0 ? result.data : [],
            };
            res.json(data);
        } catch (error) {
            this.errorHandler.requestError(res, `UploadController/getOneStatus: ${error.message}`);
        }
    }

    delete = async (req, res) => {
        try {
            const result = await UploadServiceClass.delete(req);
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, `UploadController/delete: ${error.message}`);
        }
    }
}

module.exports = UploadController = new UploadController();
