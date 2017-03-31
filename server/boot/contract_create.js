"use strict";
const output = require('./../../common/util/outputjson');
const contract_process = require("./../../common/logic/contract_process");
module.exports = function (app) {
  //app.use(loopback.token());
  console.log("contract process app");
  app.post("/api/contracts_static/construct/:userId",
    function (req, res) {
      contract_process.process(
        req, res,
        req.query["contract_type"],
        req.params["userId"],
        app.models.Contract,
        function (err, result) {
          if (err) {
            return output.outResErro(err, res);
          }
          return output.outSimpleAcknowledge(res);
        });
    });
};
