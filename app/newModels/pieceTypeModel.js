const mongoose = require("mongoose");
const mongoDB = require("../config/mongo_common.config");


const Schema = mongoose.Schema;

const pieceTypeSchema = new Schema(
    {
        piecetype: {
            type: String,
            default: null
        },
        density: {
            type: Number,
            default: null
        },
        freightclasses: {
            type: Schema.Types.ObjectId,
            ref: "freightclasses"
        },
        disabled: {
            type: Number,
            default: 1
        }
    },{ timestamps: true });
let pieceTypes = mongoDB.model("pieceTypes", pieceTypeSchema);
module.exports = pieceTypes;
