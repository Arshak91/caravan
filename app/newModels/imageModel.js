const mongoose = require("mongoose");
const mongoDB = require("../config/mongo_common.config");


const Schema = mongoose.Schema;

const imageSchema = new Schema({
    image_url: { type: String },
    filename: { type: String },
},{ timestamps: true });
let images = mongoDB.model("images", imageSchema);
module.exports = images;
