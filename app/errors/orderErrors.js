

exports.createOrderUploadError = (order) => {
    let error = false;
    let msg = [];
    if (!order.pickupCompanyName || !order.pickupState || !order.pickupStreetAddress || !order.pickupCity || !order.pickupZip) {
        error = true;
        msg.push({
            key: "pickup Address",
            msg: "Please enter the full address."
        });
    }
    if (!order.deliveryCompanyName || !order.deliveryState || !order.deliveryStreetAddress || !order.deliveryCity || !order.deliveryZip) {
        error = true;
        msg.push({
            key: "delivery Address",
            msg: "Please enter the full address."
        });
    }
    return {
        error,
        msg
    };
};