/**
 * Created by hesk on 16/5/2017.
 */
"use strict";
//setup postsql table
/**
 * Warning!!!!
 * will drop the table for the start!!!
 * @param app
 * @param cb
 */
module.exports = function (app, cb) {
  let db = app.dataSources.psql_pl_re;
  let Post = db.define('pl_network', {
    user_from: {
      type: 'String',
    },
    user_to: {
      type: 'String',
    },
    action_type: {
      type: 'Integer',
    },
    count: {
      type: 'Integer',
    },
    createtime: {
      type: 'Date',
    },
    updatetime: {
      type: 'Date',
    }
  }, {
    postgresql: {
      schema: 'people_net',
    },
  });

  db.automigrate('pl_network', function (err) {
    cb();
  });
};
