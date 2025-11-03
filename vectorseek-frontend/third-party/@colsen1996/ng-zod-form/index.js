const { z } = require("../zod");

function createForm(schema, options = {}) {
  return {
    schema,
    options,
    safeParse(value) {
      if (schema && typeof schema.parse === "function") {
        try {
          const result = schema.parse(value);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error };
        }
      }
      return { success: true, data: value };
    },
  };
}

module.exports = {
  createForm,
  z,
};
