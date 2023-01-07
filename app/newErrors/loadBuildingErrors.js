const OrderService = require("../services/order.service");
const OrderServiceClass = new OrderService();
const EquipmentSchema = require('../newModels/equipmentModel');


class Errors {

    addOrderFromLoadError = async (data) => {
        const { load, order } = data;
        let msg = "ok", error = false;
        const loadEqType = await EquipmentSchema.findById(load.equipmentId);
        const orderEqType = await EquipmentSchema.findById(order.eqType);
        
        if (load.flowType == 2 && order.depo && (load.depo.id.toString() != order.depo.toString())) {
            error  = true;
            msg = "All orders in the load must have the same depot.";
        }
        return {
            error,
            msg
        };
    };

    manualLoadTempErrors = async (data) => {
        let { orders, flowType, depo: depoId } = data.body;
        let { user } = data;
        let error = false, msg = "ok";
        if (!flowType) {
            error = true;
            msg = "flowtype is required";
        }
        if (!orders) {
            error = true;
            msg = "orders is required";
        }
        if (flowType && (flowType == 1 || flowType == 2) && !depoId) {
            error = true;
            msg = "depoId is required";
        }
        // if ((flowType || depoId) && orders) {
        //     const ordersArr = await OrderServiceClass.getAllWithoutPagination({
        //         body: {
        //             id: orders
        //         },
        //         user
        //     })
        //     for (const order of ordersArr.data.orders) {
        //         if (depoId && order._doc.depo && depoId != order._doc.depo) {
        //             error = true;
        //             msg = "All orders in the load must have the same depot.";
        //         }
        //     }
        // }
        return {
            error,
            msg
        };
    };
}

module.exports = Errors;
