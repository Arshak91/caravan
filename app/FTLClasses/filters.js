module.exports = class FiltersClass {
    constructor(params) {
        this.where = params.where;
    }

    async orderFilter() {
        let where = {};
        for (const key in this.where) {
            if (key == "deliverydateFrom") {
                where[key] = { $gte: this.where[key]};
            }
            if (key == "deliverydateTo") {
                where[key] = { $lte: this.where[key]};
            }
            if (key == "pickupdateFrom") {
                where[key] = { $gte: this.where[key]};
            }
            if (key == "pickupdateTo") {
                where[key] = { $lte: this.where[key]};
            }
            if (key == "id") {
                where._id = this.where[key];
            }
        }
        return where;
    }

    async depoFilter() {
        let where = {};
        for (const key in this.where) {
            where[key] = this.where[key];
        }
        return where;
    }

    async handlingunitFilter() {
        let where = {};
        for (const key in this.where) {
            where[key] = this.where[key];
        }
        return where;
    }

    async locationTypeFilter() {
        let where = {};
        for (const key in this.where) {
            where[key] = this.where[key];
        }
        return where;
    }

    async accessorialFilter() {
        let where = {};
        for (const key in this.where) {
            where[key] = this.where[key];
        }
        return where;
    }

    async pieceTypeFilter() {
        let where = {};
        for (const key in this.where) {
            where[key] = this.where[key];
        }
        return where;
    }

    async locationFilter() {
        let where = {};
        for (const key in this.where) {
            where[key] = this.where[key];
        }
        return where;
    }

    async driverFilter() {
        let where = {};
        for (const key in this.where) {
            where[key] = this.where[key];
        }
        return where;
    }
};
