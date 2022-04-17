const axios = require("axios");
const seal_config = require("./config");

// [WARNING] Ignore the self-signed certifications for development
// Should be remove in the production enviroment
if (process.env["NODE_ENV"] !== "production") {
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
}

// export default class SealLMClient {
//   constructor() {}

// }

async function getLocation(userId) {
  let req_str = `${seal_config.base_url}/lm/location/${userId}`;
  let response = await axios.get(req_str);
  return response;
}

module.exports = { getLocation };
