/**
 * Standardized API response helper.
 * Ensures consistent response format across all endpoints.
 */
class ApiResponse {
  /**
   * Send a success response.
   * @param {import('express').Response} res
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Response message
   * @param {*} [data] - Response data
   * @param {object} [pagination] - Pagination metadata
   */
  static success(res, statusCode, message, data = null, pagination = null) {
    const response = {
      success: true,
      message,
    };

    if (data !== null) {
      response.data = data;
    }

    if (pagination !== null) {
      response.pagination = pagination;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Send an error response.
   * @param {import('express').Response} res
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error message
   * @param {*} [errors] - Validation errors or details
   */
  static error(res, statusCode, message, errors = null) {
    const response = {
      success: false,
      message,
    };

    if (errors !== null) {
      response.errors = errors;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Build pagination metadata.
   * @param {number} page - Current page
   * @param {number} limit - Items per page
   * @param {number} total - Total items
   * @returns {object} Pagination object
   */
  static paginate(page, limit, total) {
    return {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    };
  }
}

module.exports = ApiResponse;
