const fs = require("fs");
const path = require("path");
const BaseService = require("../main_classes/base.service");


class FileService extends BaseService {
    constructor() {
        super();
    };

    getFile = async (data) => {
        const { file } = data.params;
        console.log(__dirname)
        const dirPath = path.join(__dirname, `../../resources/0/${data.urlBasedDirectory}/${file}`)
        let status = 1, message = "Success";
        const exFile = fs.readFileSync(dirPath);
        return this.getResponse(status, message, {file, exFile})
    }
};

module.exports = FileService;