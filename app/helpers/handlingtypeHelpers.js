class HandlingtypeHelper {
    getHandlingtypeModel = async (data) => {
        let obj = {
            name: data.name,
            Type: data.Type,
            weight: data.weight,
            width: data.width,
            height: data.height,
            length: data.length,
            depth: data.depth,
            density: data.density,
            disabled: data.disabled,
            description: data.description
        };
        return obj;
    }
}
module.exports = HandlingtypeHelper;