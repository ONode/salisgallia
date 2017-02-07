var
  l = require("lodash"),
  async = require('async');

var mongodb = require('mongodb'),
  Db = mongodb.Db,
  MongoClient = mongodb.MongoClient,
  Server = mongodb.Server,
  ReplSetServers = mongodb.ReplSetServers,
  ObjectID = mongodb.ObjectID,
  Binary = mongodb.Binary,
  GridStore = mongodb.GridStore,
  Grid = mongodb.Grid,
  Code = mongodb.Code,
  assert = require('assert'),
  error_ks = "ks error"
  ;

var connector_settings = {
  native_parser: true
};
var internal_connect = function (url, transaction_callback) {
  mongodb.MongoClient.connect(url, connector_settings, function (err, db) {
    if (!err) {
      transaction_callback(null, db)
    } else {
      transaction_callback(err, db);
    }
  });
};
var ensureVariableInteger = function (Query, item) {
  if (!l.isUndefined(Query.where[item])) {
    Query.where[item] = parseInt(Query.where[item]);
  }
};
var connection_db = function (db_url_set, model) {
  this.init(db_url_set, model);
  var self = this;
  return {
    find: function (_idstring, result_callback) {
      self.Model.findOne({
        _id: new ObjectID(_idstring)
      }).then(function (myDocument) {
        result_callback(myDocument);
      });
    },
    findByAttrKey: function (keyName, SimpleValue, result_callback) {
      self.Model.find({
        keyName: SimpleValue
      }).then(function (cursor) {
        var myDocument = cursor.hasNext() ? cursor.next() : null;
        result_callback(myDocument);
      });
    },
    findByAttrKeyPagination: function (keyName, SimpleValue, result_callback, _skip, _limit) {
      self.Model.find({
        keyName: SimpleValue
      }).skip(_skip).limit(_limit).then(function (cursor) {
        var myDocument = cursor.hasNext() ? cursor.next() : null;
        result_callback(myDocument);
      });
    },
    lbQueryLooper: function (QueryContext, query_additional_options, resultcb) {
      var Query = QueryContext.req;
      var Q = Query.query;

      if (!Query) {
        Q = {
          filter: {
            where: {},
            limit: 12,
            skip: 0
          },
          result: {}
        }
      }

      //preset for default result object;
      Q.result = {
        count: 0,
        page: 0
      };

      if (!l.isEmpty(query_additional_options)) {
        Q.filter.where = l.merge(Q.filter.where, query_additional_options);
      }

      if (!Query.query || !Query.query["filter"]["where"]) {
        Q.filter.where = {};
      }

      if (!Query.query["filter"]) {
        Q.filter.limit = 12;
        Q.filter.skip = 0;
      } else {
        Q.filter.limit = parseInt(Q.filter.limit);
        Q.filter.skip = parseInt(Q.filter.skip);
      }

      var isSingle = !l.isEmpty(Q.filter.where.id && Q.filter.where._id);
      var hasOwnerQuery = !l.isEmpty(Q.filter.where.owner);

      if (isSingle) {
        var id = Q.filter.where.id || Q.filter.where._id;
        Q.filter.where._id = new ObjectID(id);
        self.Model.findOne(Q.filter.where).then(function (doc) {
          resultcb(null, doc);
        });
      } else {
        var cursor = self.Model.find(Q.filter.where).skip(Q.filter.skip).limit(Q.filter.limit);
        cursor.count().then(function (count_n) {
          Q.result.count = count_n;
          Q.result.page = Math.floor(count_n / Q.filter.limit) + 1;
          QueryContext.args.filter = Q.filter;
          QueryContext.args.result = Q.result;
          cursor.toArray(function (err, results) {
            if (err) {
              resultcb(err, null);
              return;
            }
            resultcb(null, results);
          });

        });
      }
    },
    findByAttrKeyAdvancePagination: function (objectQuery, result_callback, _skip, _limit) {
      self.Model.find(objectQuery).skip(_skip).limit(_limit).then(function (cursor) {
        result_callback(cursor.toArray());
      });
    },
    findByAttrKeyAdvance: function (objectQuery, result_callback) {
      self.Model.find(objectQuery).then(function (cursor) {
        result_callback(cursor.toArray());
      });
    },
    insertOrUpdate: function (_id_, object, result_callback) {
      try {
        if (_id_) {
          self.Model.count({
            _id: new ObjectID(_id_)
          }).then(function (__count) {
            if (__count > 0) {
              self.Model.updateOne({
                _id: new ObjectID(_id_)
              }, {$set: object}).then(function (result) {
                result_callback(result);
              });
            } else {
              self.Model.insertOne(l.defaults(
                {_id: new ObjectID(_id_)}, object
              )).then(function (result) {
                result_callback(result);
              });
            }
          });
        } else {
          self.Model.insertOne(l.defaults(
            {_id: new ObjectID(_id_)}, object
          )).then(function (result) {
            result_callback(result);
          });
        }
      } catch (e) {
        console.log(error_ks, e);
      }
    }
  }
};
connection_db.prototype.castInt = function (q, value) {
  return ensureVariableInteger(q, value);
};
connection_db.prototype.init = function (a, _model) {
  internal_connect(a, function (err, db) {
    this.Model = db.collection(_model);
  }.bind(this));
};
module.exports = function (a, b) {
  return new connection_db(a, b);
};
