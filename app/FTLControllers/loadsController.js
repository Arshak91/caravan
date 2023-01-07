const BaseController = require('../main_classes/base.controller');
const LoadsService = require('../services/loads.service');

const Service = new LoadsService();

class LoadsController extends BaseController {

    confirm = async (req, res) => {
        try {
            const result = await Service.confirm(req.body,  req.user, req.headers.timezone);
            return res.send(result);
        } catch (error) {
            this.errorHandler.requestError(res, error.message);
        }
    };

    getAll = async (req, res) => {
        try {
            const result = await Service.getAll(req);
            return res.send(result);
        } catch (error) {
            this.errorHandler.requestError(res, error.message);
        }
    }

    getById = async (req, res) => {
        try {
            const result = await Service.getbyId(req);
            return res.send(result);
        } catch (error) {
            this.errorHandler.requestError(res, error.message);
        }
    }
};

module.exports = new LoadsController();