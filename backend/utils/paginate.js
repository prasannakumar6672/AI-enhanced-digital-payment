/**
 * Database pagination utility helpers
 */

/**
 * Resolves standard pagination limits and offsets from query parameters
 * @param {Object} query - Express req.query object
 * @returns {Object} - { limit, offset, page }
 */
const getPagination = (query) => {
    const page = parseInt(query.page, 10) > 0 ? parseInt(query.page, 10) : 1;
    const limit = parseInt(query.limit, 10) > 0 ? parseInt(query.limit, 10) : 10;
    const offset = (page - 1) * limit;

    return { limit, offset, page };
};

/**
 * Formats database results and total rows counts into a response object
 * @param {Object} data - { count: totalItems, rows: items }
 * @param {Number} page - current page number
 * @param {Number} limit - page limit boundary size
 * @returns {Object} - formatted paginated metadata
 */
const getPagingData = (data, page, limit) => {
    const { count: totalItems, rows: items } = data;
    const currentPage = page;
    const totalPages = Math.ceil(totalItems / limit);

    return { totalItems, items, totalPages, currentPage };
};

module.exports = { getPagination, getPagingData };
