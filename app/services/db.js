
class PaginationService {
    sortAndPagination = async (query) => {
        // console.log(req.query);
        let orderBy = !query.orderBy || query.orderBy == "id" ? "ID" : query.orderBy;
        // const orderBy = orderBy ? orderBy : "_id";
        delete query.orderBy;

        const order = query.order == "asc" ? 1 : -1;
        delete query.order;

        const orderArr = [];
        if (orderBy) { orderArr.push([orderBy, order]); }

        const page = query.page ? parseInt(query.page) : 1;
        delete query.page;

        const limit = query.limit ? parseInt(query.limit) : 10;
        delete query.limit;

        const offset = (page - 1) * limit;

        return { order: orderArr, offset, limit };
    }
}

module.exports = PaginationService;