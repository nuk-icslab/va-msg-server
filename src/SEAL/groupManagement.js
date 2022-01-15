const axios = require("axios");
const logger = require("../logger");

const SsGroupManagement = require("./openapi/ss_group_management/index.js");
const seal_config = require("./config");

let api_client = new SsGroupManagement.ApiClient(
  `${seal_config.base_url}/ss-gm/v1`
);
let api = new SsGroupManagement.DefaultApi(api_client);

class GroupManagement {
  groupDocumentsGet(opts) {
    return new Promise((resolve, reject) => {
      api.groupDocumentsGet(opts, (error, data, response) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });
    });
  }
  groupDocumentsPost(valGroupDocument) {
    return new Promise((resolve, reject) => {
      api.groupDocumentsPost(valGroupDocument, (error, data, response) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });
    });
  }
  groupDocumentsGroupDocIdDelete(groupDocId) {
    return new Promise((resolve, reject) => {
      api.groupDocumentsGroupDocIdDelete(
        groupDocId,
        (error, data, response) => {
          if (error) {
            reject(error);
          } else {
            resolve(data);
          }
        }
      );
    });
  }
  groupDocumentsGroupDocIdGet(groupDocId, opts) {
    return new Promise((resolve, reject) => {
      api.groupDocumentsGroupDocIdGet(
        groupDocId,
        opts,
        (error, data, response) => {
          if (error) {
            reject(error);
          } else {
            resolve(data);
          }
        }
      );
    });
  }
  groupDocumentsGroupDocIdPut(groupDocId, valGroupDocument) {
    return new Promise((resolve, reject) => {
      api.groupDocumentsGroupDocIdPut(
        groupDocId,
        valGroupDocument,
        (error, data, response) => {
          if (error) {
            reject(error);
          } else {
            resolve(data);
          }
        }
      );
    });
  }
  groupGetByUserId(userId) {
    return new Promise(async (resolve, reject) => {
      try {
        if (userId === "") {
          resolve([]);
          return;
        }
        let req_str = `${seal_config.base_url}/custom-gm/groups/${userId}`;
        let response = await axios.get(req_str);
        response = response.data;
        resolve(response);
      } catch (e) {
        logger.error(e);
        reject(e);
      }
    });
  }
}

module.exports = GroupManagement;
