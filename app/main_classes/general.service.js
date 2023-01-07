const env = process.env.SERVER == "local" ? require("../config/env.local") : require("../config/env");
const OrderModel = require("../newModels/ordersModel");

class GeneralHelper {
    getRemoteInfoForKey = async (req) => {
        let host, endPoint, errorServerEndPoint;
        let api = "";
        let uri = api + "/autoplan", companyName;
        const myURL = req.headers["x-forwarded-host"];
        if (myURL) {
            endPoint = `http://${myURL}` + uri;
            host = `http://${myURL}`;
            companyName = myURL.split(".")[0];
            errorServerEndPoint = `http://${myURL}` + '/planning/engine/error';
        } else {
            endPoint = `http://${req.headers.host}${uri}`;
            host = `http://${req.headers.host}`;
            companyName = req.headers.host.split(":")[0];
            errorServerEndPoint = `http://${req.headers.host}/planning/engine/error`;
        }
        let info = {
            host,
            userName: req.user ? req.user.username : null,
            email: req.user ? req.user.email : null,
            userType: req.user ? req.user.type : null,
            userAgent: req.headers["user-agent"],
            endPoint,
            errorServerEndPoint,
            companyName
        };
        return info;
    };

    trim = async (obj, edit) => {
        for (let item in obj) {
            if (typeof obj[item] == "string") {
                obj[item] = obj[item].trim();
                if (!obj[item]) {
                    !edit ? delete obj[item] : null
                }
            }
        }
        return obj;
    };
    trimAndSplit = async (obj) => {
        for (let item in obj) {
            if (typeof obj[item] == "string" && obj[item].trim() !== "") {
                if (item.trim() == "cu.ft") {
                    obj[item] = obj[item].trim();
                    if (!obj[item]) {
                        delete obj[item]
                    } else {
                        obj[item] = obj[item].split("c")[0].trim();
                        obj[item] = Number(obj[item])
                    }
                }
                if (item.trim() == "kgs") {
                    obj[item] = obj[item].trim();
                    if (!obj[item]) {
                        delete obj[item]
                    } else {
                        obj[item] = obj[item].split("k")[0].trim();
                        obj[item] = Number(obj[item])
                    }
                }
                if (item.trim() == "lbs") {
                    obj[item] = obj[item].trim();
                    if (!obj[item]) {
                        delete obj[item]
                    } else {
                        obj[item] = obj[item].split("l")[0].trim();
                        obj[item] = Number(obj[item])
                    }
                }
                if (item.trim() == "m3") {
                    obj[item] = obj[item].trim();
                    if (!obj[item]) {
                        delete obj[item]
                    } else {
                        obj[item] = obj[item].split("m")[0].trim();
                        obj[item] = Number(obj[item])
                    }
                }
                if (item.trim() == "pcs") {
                    obj[item] = obj[item].trim();
                    if (!obj[item]) {
                        delete obj[item]
                    } else {
                        obj[item] = obj[item].split("p")[0].trim();
                        obj[item] = Number(obj[item])
                    }
                }
                if (item.trim() == "skids") {
                    obj[item] = obj[item].trim();
                    if (!obj[item]) {
                        delete obj[item]
                    } else {
                        obj[item] = obj[item].split("s")[0].trim();
                        obj[item] = Number(obj[item])
                    }
                }
                // ord
                if (item.trim() == "cu.ft_ord") {
                    obj[item] = obj[item].trim();
                    if (!obj[item]) {
                        delete obj[item]
                    } else {
                        obj[item] = obj[item].split("c")[0].trim();
                        obj[item] = Number(obj[item])
                    }
                }
                if (item.trim() == "kgs_ord") {
                    obj[item] = obj[item].trim();
                    if (!obj[item]) {
                        delete obj[item]
                    } else {
                        obj[item] = obj[item].split("k")[0].trim();
                        obj[item] = Number(obj[item])
                    }
                }
                if (item.trim() == "lbs_ord") {
                    obj[item] = obj[item].trim();
                    if (!obj[item]) {
                        delete obj[item]
                    } else {
                        obj[item] = obj[item].split("l")[0].trim();
                        obj[item] = Number(obj[item])
                    }
                }
                if (item.trim() == "m3_ord") {
                    obj[item] = obj[item].trim();
                    if (!obj[item]) {
                        delete obj[item]
                    } else {
                        obj[item] = obj[item].split("m")[0].trim();
                        obj[item] = Number(obj[item])
                    }
                }
                if (item.trim() == "pcs_ord") {
                    obj[item] = obj[item].trim();
                    if (!obj[item]) {
                        delete obj[item]
                    } else {
                        obj[item] = obj[item].split("p")[0].trim();
                        obj[item] = Number(obj[item])
                    }
                }
                if (item.trim() == "skids_ord") {
                    obj[item] = obj[item].trim();
                    if (!obj[item]) {
                        delete obj[item]
                    } else {
                        obj[item] = obj[item].split("s")[0].trim();
                        obj[item] = Number(obj[item])
                    }
                }
            }
        }
        return obj;
    };

    reverseObject = async (data) => {
        let obj = {};
        for (const key in data) {
            obj[data[key]] = key;
        }
        return obj;
    }

    indexingArr = async (idList) => {
        const x = idList.map((item, index) => ({ id: item, i: index }));
        return x;
    }

    sortArray = async (example, data) => {
        const sortedData = [];
        example.map(item => {
            data.map(x => {
                let id = x._doc._id.toString();
                if(id == item.id.toString()) {
                    sortedData.push(x._doc);
                }
            } )
        });
        return sortedData;
    }
    sortArrayByID = async (example, data) => {
        const orderList = [], order_ids = [];
        example.map(item => {
            data.map(x => {
                if(x._doc.ID == item.id) {
                    orderList.push(x._doc);
                    order_ids.push(x._doc._id)
                }
            } )
        });
        return {orderList, order_ids};
    }

    getLastID = async (name) => {
        const location = await name.find({}).sort([["_id", -1]]).limit(1);
        const lastLocationID = location[0] && location[0].get("ID") ? location[0].get("ID") : 0;
        return lastLocationID;
    };
    getIDby_id = async (data) => {
        let { ids, orderIDS } = data, IDSArr = [];
        let orders;
        if (ids) {
            for (const id of ids) {
                const order = await OrderModel.findById(id, "ID");
                IDSArr.push(order.get("ID"))
            }
        } else if (orderIDS) {
            for (const id of orderIDS) {
                const order = id ? await OrderModel.findOne({ID: id}, "ID") : null;
                order ? IDSArr.push(order._id) : null
            }
        }
        return IDSArr
    }

};

module.exports = GeneralHelper;