const uuidV1 = require('uuid/v1');
const BaseService = require("../main_classes/base.service");
// classes
const UserService = require("./user.service");
const UserServiceClass = new UserService();
const SettingsService = require("./settings.service");
const SettingsServiceClass = new SettingsService();
const Helper = require("../main_classes/general.service");
//
const jwt = require("jsonwebtoken");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const config = require("../config/config.js");
const Errors = require("../errors/authErrors");
// Models
const apiKeyModel = require("../newModels/ApiKeyModel");


class AuthService extends BaseService {

    constructor() {
        super();
    };

    signin = async (req) => {
		console.log("SignIn: ", req.headers);
        const where = {$or: [{username: { $regex: '.*' + req.body.username + '.*' }}, {email: { $regex: '.*' + req.body.username + '.*' }}]};
		let user = await UserServiceClass.getOneWithRole(where);

		if (!user.status) {
			return this.getResponse(0, user.msg);
		}
		let passwordIsValid = user.data.password ? bcrypt.compareSync(req.body.password, user.data.password) : false;
		if (!passwordIsValid) {
			return this.getResponse(0, "Invalid Password!", {auth: false});
		}
		let authorities = [];
		const roles = await user.data.get("role");
		authorities.push("ROLE_" + roles.name.toUpperCase());
		const Error = await Errors.authError({
			body: req.body,
			user: user.data,
			authorities
		});
		if (Error && Error.error) {
			return this.getResponse(0, Error.msg);
		} else {
			const HelperClass = new Helper();
			let info = await HelperClass.getRemoteInfoForKey(req), createKeyClass;
			const apiKey = await apiKeyModel.findOne({
				host: info.host,
				user: user.data._id
			});
			if (!apiKey) {
				const uKey = uuidV1();
				createKeyClass = await apiKeyModel.create({
					Key: uKey,
					Expire: "2080-02-12T04:00:00.000Z",
					companyName: info.companyName,
					host: info.host,
					user: user.data._id
				}).catch(err => {
					console.log(err.message);
				})
			}
			var jwtUUID = "1234567890";
			const path = "jwt.uuid";
			if (fs.existsSync(path)){
				jwtUUID = fs.readFileSync(path, "utf8").toString();
			}
			let expire = "31d";
			delete user.data._doc.password;
			delete user.data.password;
			const token = jwt.sign({ user: user.data, jwtUUID }, config.secret, {
				expiresIn: expire // expires in 31 day
			});
			const response = {
				auth: true,
				status: 1,
				accessToken: token,
				username: user.data.username,
				userId: user.data.id,
				authorities: authorities
			};
			return this.getResponse(1, " ", response);
		}
	};

    signUp = async (req) => {
		let user = await UserServiceClass.create({data: req.data});
		if (user.status) {
			await SettingsServiceClass.create({
				user: user.data._id
			})
		}
		return this.getResponse(1, user.msg, user.data);
	};

	logOut = async (req) => {
		let userId = req.user._id, message = "LogOut", status = 1;
		let { socketId } = req.body;
		const socket = require("../../server");
		const user = await UserServiceClass.update({
			body: {
				logoutAt: Date.now(),
				_id: userId
			}
		});
		await socket.disconnected(socketId)
		if(!user.status) { message = user.message; status = user.status}
		return this.getResponse(status, message);
	}
};

module.exports = AuthService;