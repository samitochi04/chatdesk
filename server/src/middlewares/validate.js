const ApiError = require("../utils/ApiError");

/**
 * Creates a middleware that validates `req[property]` against a Joi schema.
 *
 * @param {import('joi').ObjectSchema} schema  — Joi schema
 * @param {'body'|'query'|'params'} property  — which part of the request to validate
 */
const validate = (schema, property = "body") => {
  return (req, _res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((d) => d.message);
      return next(ApiError.badRequest("Validation error", details));
    }

    // Replace with sanitized values
    req[property] = value;
    next();
  };
};

module.exports = validate;
