// [WARNING] Ignore the self-signed certifications for development
// Should be remove in the production enviroment
if (process.env["NODE_ENV"] !== "production") {
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
}

const axios = require("axios");
const qs = require("qs");
const seal_base_url = "https://seal.5gsvc:29549";

class SealIMClient {
  getUserID(access_token) {
    return new Promise(async (resolve, reject) => {
      try {
        let req_str = `${seal_base_url}/oidc/me`;
        let response = await axios({
          method: "post",
          url: req_str,
          headers: { "content-type": "application/x-www-form-urlencoded" },
          data: qs.stringify({ access_token }),
        });
        let user_profile = response.data;
        resolve(user_profile["sub"]);
      } catch (e) {
        if (e.response.status === 401) {
          resolve(null);
        } else {
          reject(e);
        }
      }
    });
  }
}

module.exports = SealIMClient;
