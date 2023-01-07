const Warnings = require("../warnings/orderWarnings");
const Errors = require("../errors/orderErrors");
const BaseController = require("../main_classes/base.controller");
const OrderService = require("../services/order.service")
const OrderServiceClass = new OrderService();


class OrderController extends BaseController {
    constructor() {
        super()
    }

    getAll = async (req, res) => {
        try {
            const result = await OrderServiceClass.getAll(req);
            return res.json(result);
        } catch (error) {
            this.errorHandler.requestError(res, `OrderController/getAll: ${error.message}`);
        }
    };

    getById = async (req, res) => {
        try {
            const result = await OrderServiceClass.getById(req);
            return res.json(result);
        } catch (error) {
            this.errorHandler.requestError(res, `OrderController/getById: ${error.message}`);
        }
    }

    getFew = async (req, res) => {
        try {
            const result = await OrderServiceClass.getFew(req);
            return res.json(result);
        } catch (error) {
            this.errorHandler.requestError(res, `OrderController/getFew: ${error.message}`);
        }
    }

    create = async (req, res) => {
        try {
            const result = await OrderServiceClass.create(req)
            res.json(result)
        } catch (error) {
            console.log(error);
            this.errorHandler.requestError(res, `OrderController/create: ${error.message}`);
        }
    };

    edit = async (req, res) => {
        try {
            const result = await OrderServiceClass.update(req)
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, `OrderController/edit: ${error.message}`);
        }
    };

    deleted = async (req, res) => {
        try {
            const result = await OrderServiceClass.delete(req)
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, `OrderController/delete: ${error.message}`);
        }
    };

    upload = async (req, res) => {
        try {
            const result = await OrderServiceClass.uploadNew(req)
            res.json(result)
        } catch (error) {
            console.log("Upload Error: ", error);
            this.errorHandler.requestError(res, `OrderController/upload: ${error.message}`);
        }
    };

    uploadByApiKey = async (req, res) => {
        try {
            const result = await OrderServiceClass.uploadByApiKey(req)
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, `OrderController/uploadByApiKey: ${error.message}`);
        }
    }

    summ = async (req, res) => {
        try {
            const result = await OrderServiceClass.summOrderServicetime(req.body)
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, `OrderController/summ: ${error.message}`);
        }
    };

    bulkEdit = async (req, res) => {
        try {
            const result = await OrderServiceClass.bulkEdit(req)
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, `OrderController/bulkEdit: ${error.message}`);
        }
    };

    getAutoPlanCount = async (req, res) => {
        try {
            const result = await OrderServiceClass.getAutoPlanCount(req)
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, `OrderController/getAutoPlanCount: ${error.message}`);
        }
    }

    changeOnWayStatus = async (req, res, next) => {
        try {
            const result = await OrderServiceClass.changeOnWayStatus(req)
            if (result.status) {
                next()
            }else {
                res.json(result)
            }
        } catch (error) {
            this.errorHandler.requestError(res, `OrderController/changeOnWayStatus: ${error.message}`);
        }
    };

    getImage = async (req, res, next) => {
        req.urlBasedDirectory = "images";
        next();
    }

    updateTest = async (req, res) => {
        try {
            const result = await OrderServiceClass.updateTest(req)
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, `OrderController/updateTest: ${error.message}`);
        }
    };

    resetModel = async (req, res) => {
        try {
            const result = await OrderServiceClass.resetModel(req)
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, `OrderController/resetModel: ${error.message}`);
        }
    }
}

module.exports = OrderController = new OrderController()
