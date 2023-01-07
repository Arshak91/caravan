const LocationService = require("../services/location.service");
const LocationServiceClass = new LocationService();
const BaseController = require("../main_classes/base.controller");


class LocationController extends BaseController {
    constructor() {
        super()
    }

    getAll = async (req, res) => {
        try {
            const result = await LocationServiceClass.getAll(req);
            return res.json(result);
        } catch (error) {
            this.errorHandler.requestError(res, `LocationController/getAll: ${error.message}`);
        }
    };

    getById = async (req, res) => {
        try {
            const result = await LocationServiceClass.getById(req);
            return res.json(result);
        } catch (error) {
            this.errorHandler.requestError(res, `LocationController/getById: ${error.message}`);
        }
    };
    create = async (req, res) => {
        try {
            let location = await LocationServiceClass.create(req.body);
            res.json(location)
        } catch (error) {
            this.errorHandler.requestError(res, `LocationController/create: ${error.message}`);
        }
    };

    edit = async (req, res, next) => {
        try {
            const location = await LocationServiceClass.edit(req);
            location.status == 2 ? next() : res.json(location)
        } catch (error) {
            this.errorHandler.requestError(res, `LocationController/edit: ${error.message}`);
        }
    };

    delete = async (req, res, next) => {
        try {
            let location = await LocationServiceClass.delete(req);
            res.json(location)
        } catch (error) {
            this.errorHandler.requestError(res, `LocationController/delete: ${error.message}`);
        }
    }
}

module.exports = LocationController = new LocationController();
