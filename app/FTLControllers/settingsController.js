const SettingsService = require("../services/settings.service");
const SettingsServiceClass = new SettingsService();
const BaseController = require("../main_classes/base.controller");

class SettingsController extends BaseController {
    constructor() {
        super()
    }

    getAll = async (req, res) => {
        try {
            const result = await SettingsServiceClass.getAll(req);
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, `SettingsController/getAll: ${error.message}`);
        }
    }


    getOne = async (req, res) => {
        try {
            const result = await SettingsServiceClass.getOne({
                where: req.query,
                userId: req.user._id
            });
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, `SettingsController/getOne: ${error.message}`);
        }
    };

    edit = async (req, res) => {
        try {
            const result = await SettingsServiceClass.update(req);
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, `SettingsController/edit: ${error.message}`);
        }
    }
}

module.exports = SettingsController = new SettingsController()