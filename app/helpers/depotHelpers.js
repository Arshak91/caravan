const GeneralHelper = require("../main_classes/general.service");
// Schema
const DepotSchema = require("../newModels/depoModel");

class DepotHelper extends GeneralHelper {
    getDepotModel = async (data, edit) => {
        const lastID = await this.getLastID(DepotSchema);
        let model = {
            name: data.name,
            streetaddress: data.streetaddress,
            city: data.city,
            state: data.state,
            zip: data.zip,
            country: data.country,
            countryCode: data.countryCode,
            lat: `${data.lat}`,
            lon: `${data.lon}`,
            workinghours: data.workinghours
        };
        model = await this.trim(model, edit);
        !edit ? model["ID"] = lastID ? lastID+1 : 1000 : null;
        return model;
    }
}
module.exports = DepotHelper;