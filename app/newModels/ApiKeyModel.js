const mongoose = require("mongoose");
const mongoDB = require("../config/mongo_common.config");
const Schema = mongoose.Schema;

const apiKeySchema = new Schema({
    Key: {
        type: String,
        unique: true,
        required: true
    },
    Name: {
        type: String,
        default: 'Unique Key'
    },
    companyName: {
        type: String,
        required: true
    },
    Description: {
        type: String,
        default: 'Keys for Clients'
    },
    Expire: {
        type: Date,
        required: true
    },
    host: {
        type: String,
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
		ref: "users",
    }
},{ timestamps: true });

const ApiKeys = mongoDB.model("ApiKeys", apiKeySchema);
module.exports = ApiKeys;