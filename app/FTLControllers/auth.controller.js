const BaseController = require('../main_classes/base.controller');
const AuthService = require('../services/auth.service');
const AuthServiceClass = new AuthService();


class AuthController extends BaseController {
    constructor() {
        super();
    }
    signin = async (req, res) => {
        try {
            const result = await AuthServiceClass.signin(req);
            let status = result.status ? 200 : 401;
            return res.status(status).json(result);
        } catch (error) {
            this.errorHandler.requestError(res, `authController/signin: ${error.message}`);
        }
    };

    signUp = async (req, res) => {
        try {
            const result = await AuthServiceClass.signUp(req);
            return res.send(result);
        } catch (error) {
            this.errorHandler.requestError(res, `authController/signup: ${error.message}`);
        }
    };

    logOut = async (req, res) => {
        try {
            const result = await AuthServiceClass.logOut(req);
            return res.send(result);
        } catch (error) {
            this.errorHandler.requestError(res, `authController/logOut: ${error.message}`);
        }
    }
};

module.exports = AuthController = new AuthController();