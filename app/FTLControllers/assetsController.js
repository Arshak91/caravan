const AssetService = require("../services/assets.service");
const AssetServiceClass = new AssetService();
const BaseController = require("../main_classes/base.controller");

class AssetController extends BaseController {
    constructor() {
        super()
    }

    getAll = async (req, res) => {
        try {
            const result = await AssetServiceClass.getAll(req);
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, `AssetController/getAll: ${error.message}`);
        }
    };

    getById = async (req, res) => {
        try {
            const result = await AssetServiceClass.getById(req);
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, `AssetController/getById: ${error.message}`);
        }
    }

    create = async (req, res) => {
        try {
            const result = await AssetServiceClass.create(req.body);
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, `AssetController/create: ${error.message}`);
        }
    }

    edit = async (req, res) => {
        try {
            const result = await AssetServiceClass.edit(req.body);
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, `AssetController/edit: ${error.message}`);
        }
    }
    delete = async (req, res) => {
        try {
            const result = await AssetServiceClass.delete(req.body);
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, `AssetController/delete: ${error.message}`);
        }
    }
}

module.exports = AssetController = new AssetController()
