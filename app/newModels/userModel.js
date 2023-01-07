const mongoose = require("mongoose");
const mongoDB = require("../config/mongo_common.config");


const Schema = mongoose.Schema;
const usersSchema = new Schema({
	name: {
		type: String
	},
	username: {
		type: String
	},
	email: {
		type: String
	},
	password: {
		type: String
	},
	role: {
		type: Schema.Types.ObjectId,
		ref: "roles",
	},
	drivers: [{
		type: Schema.Types.ObjectId,
		ref: "drivers",
	}],
	changePasswordAt: { type: Date },
	logoutAt: { type: Date }

},{ timestamps: true, collection: 'users' });
const users = mongoDB.model("users", usersSchema);
module.exports = users;
