/**
 * Created by zJJ on 7/20/2016.
 */
"use strict";
console.log("Loading module detector");
module.exports = function (app) {
  let modelNames = Object.keys(app.models);
  let models = [];
  modelNames.forEach(function (m) {
    let modelName = app.models[m].modelName;
    if (models.indexOf(modelName) === -1) {
      models.push(modelName);
    }
  });
  console.log('> Models:\n', models);
  let Basemap = app.loopback.getModel('Basemap');
  console.log(Basemap.settings.acls);
  let version = app.loopback.version;
  console.log('LoopBack system is now running at v%s and it is now running the application with the configuration of [[%s]]',
    version, process.env.NODE_ENV);
};

