const jwt = require("jsonwebtoken");
const config = require("../config/config.js");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const moment = require("moment");
const { URL } = require("url");
const Users = require("../newModels/userModel");

const ApiKey = require("../newModels/ApiKeyModel");

const verifyToken = async (req, res, next) => {
	let token = req.headers["x-access-token"];

	var jwtUUID = "1234567890";
	const path = "jwt.uuid";
	if (fs.existsSync(path)){
		jwtUUID = fs.readFileSync(path, "utf8").toString();
	}

	await jwt.verify(token, config.secret, async (err, decoded) => {
		let user;
		if (decoded) {
			user = await Users.findOne({
				_id: decoded.user._id
			}).catch(err => {
				console.log(err);
			});
		}
		if (!user || err || (req.url !== "/api/signout" && user.changePasswordAt && new Date(user.changePasswordAt).getTime() > decoded.iat * 1000) || (user.logoutAt && new Date(user.logoutAt).getTime() > decoded.iat * 1000) || decoded.jwtUUID != jwtUUID){
			console.log("Rejected  token", req.headers["x-access-token"]);
			console.table([{ "Host": req.headers.host , "Time" : moment().format(), "url": req.url, "method": req.method }]);
			return res.status(401).json({
				auth: false,
				message: "Fail to Authentication. Error -> " + err ? err : "password changed!!"
			});
		}
		req.user = decoded.user;
		req.companyName = req.headers["x-forwarded-host"] ? req.headers["x-forwarded-host"].split(".")[0] : req.headers.referer && req.headers.referer !== "192.168.88.87:8080" && new URL(req.headers.referer) ? new URL(req.headers.referer).hostname.split(".")[0] : "localHost";
	});

	next();
};

const verifyApiKey = async (req, res, next) => {
	let apiKey = req.headers["x-api-key"];
	let key;
	if (apiKey) {
		key = await ApiKey.findOne({
			Key: apiKey
		}).populate("user");
		let expire = key ? key._doc.Expire : 0;
		let now = new Date();
		if (key && expire.getTime() > now.getTime()) {
			req.companyName = req.headers["x-forwarded-host"] ? req.headers["x-forwarded-host"].split(".")[0] : req.headers.host && req.headers.host != "192.168.88.87:8080" && req.headers.referer && new URL(req.headers.referer) ? new URL(req.headers.referer).hostname.split(".")[0] : "localHost";
			req.user = key._doc.user._doc;
			next();
		} else {
			return res.status(409).json({
				status: 0,
				msg: "key expired or invalid"
			});
		}
	} else {
		return res.status(409).json({
			status: 0,
			msg: "apiKey is required"
		});
	}
};

const isAdmin = (req, res, next) => {
	Users.findById(req.userId)
		.then(user => {
			user.getRoles().then(roles => {
				for(let i=0; i<roles.length; i++){
					console.log(roles[i].name);
					if(roles[i].name.toUpperCase() === "ADMIN"){
						next();
						return;
					}
				}
				res.status(403).send("Require Admin Role!");
				return;
			});
		});
};

const isPmOrAdmin = (req, res, next) => {
	Users.findOne({ id: req.userId })
		.then(user => {
			user.getRoles().then(roles => {
				for(let i=0; i<roles.length; i++){
					if(roles[i].name.toUpperCase() === "PM"){
						next();
						return;
					}
					if(roles[i].name.toUpperCase() === "ADMIN"){
						next();
						return;
					}
				}
				res.status(403).send("Require PM or Admin Roles!");
			});
		}).catch(err => {
			res.status(500).send({
				"description": "Can not access Admin Board",
				"error": err
			});
		});
};

const authJwt = {};
authJwt.verifyToken = verifyToken;
authJwt.verifyApiKey = verifyApiKey;
authJwt.isAdmin = isAdmin;
authJwt.isPmOrAdmin = isPmOrAdmin;

module.exports = authJwt;