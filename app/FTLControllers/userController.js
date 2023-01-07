const jwt = require("jsonwebtoken");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const Errors = require("../errors/authErrors");
const config = require("../config/config.js");
const UserClass = require("../FTLClasses/user");
const SettingsClass = require("../FTLClasses/settings");
const BaseController = require("../main_classes/base.controller");
const UserService = require("../services/user.service");
const UserServiceClass = new UserService();
class UserController extends BaseController {
	constructor() {
		super()
	}

	changePassword = async (req, res) => {
		try {
            const result = await UserServiceClass.changePassword(req);
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, `UserController/getAll: ${error.message}`);
        }
	}

	// signin = async (req, res) => {
	// 	console.log("SignIn: ", req.headers);
	// 	try {
	// 		const userCl = new UserClass({where: {$or: [{username: req.body.username}, {email: req.body.username}]} });

	// 	} catch (error) {
	// 		console.log(error);
	// 	}
	// 	console.log(userCl);
	// 	let user;
	// 	user = await userCl.getOneWithRole();
	
	// 	if (!user.status) {
	// 		return res.status(401).json(user);
	// 	}
	// 	let passwordIsValid = user.data.password ? bcrypt.compareSync(req.body.password, user.data.password) : false;
	// 	if (!passwordIsValid) {
	// 		return res.status(401).json(this.helper.getResponse(0, "Invalid Password!", {auth: false}));
	// 	}
	
	// 	let authorities = [];
	// 	const roles = await user.data.get("role");
	// 	authorities.push("ROLE_" + roles.name.toUpperCase());
	// 	const Error = await Errors.authError({
	// 		body: req.body,
	// 		user: user.data,
	// 		authorities
	// 	});
	// 	if (Error && Error.error) {
	// 		res.status(401).send({
	// 			status: 0,
	// 			msg: Error.msg
	// 		});
	// 	} else {
	// 		let info = await this.helper.getRemoteInfoForKey(req);
	// 		var jwtUUID = "1234567890";
	// 		const path = "jwt.uuid";
	// 		if (fs.existsSync(path)){
	// 			jwtUUID = fs.readFileSync(path, "utf8").toString();
	// 		}
	// 		let expire = "31d";
	// 		delete user.data._doc.password;
	// 		const token = jwt.sign({ user: user.data, jwtUUID }, config.secret, {
	// 			expiresIn: expire // expires in 31 day
	// 		});
	// 		const response = {
	// 			auth: true,
	// 			status: 1,
	// 			accessToken: token,
	// 			username: user.data.username,
	// 			userId: user.data.id,
	// 			authorities: authorities
	// 		};
	// 		res.json(response);
	// 	}
	// };
	// signUp = async (req, res) => {
	// 	const userCl = new UserClass({data: req.data});
	// 	let user, settings;
	// 	user = await userCl.create();
	// 	if (user.status) {
	// 		const settingsCl = new SettingsClass({data: {
	// 			user: user.data._id
	// 		}})
	// 		await settingsCl.create()
	// 	}
	// 	res.json(user);
	// };
}

module.exports = UserController = new UserController();