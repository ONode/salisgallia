/**
 * Created by hesk on 13/3/2017.
 */

module.exports = function (app, cb) {
  console.log("update batch job", "convert object id into string id to adapt the new updates");
  console.log("--start working ...");
  let requests = [];
  let modelname = "Contract";
  let model = app.models.Basemap.getDataSource();
  let tst_subject_db = app.datasources.rocket_us_east;
  //  let tst_subject_db = app.datasources.mlab_test_db;
  tst_subject_db.connector.connect(function (err, db) {
    let collection = db.collection(modelname);
    let where = {};
    //where[fk_field] = patch_to_ensure_monogodb_id(persistentModel, fk_id);
    let cursor = collection.find(where);
    // let updateone = function (_id, owner_id) {
    // collection.updateOne({"userId": _id}, {"$set": {"userId": owner_id}});
    //};
    let bw = {};
    cursor.forEach(document => {
        //  let document = cursor.next();
        if (document.userId) {
          // console.log("basemap owner id", typeof (document.owner));
          if (typeof (document.userId) == 'string') {
            let t = String(document.userId);
            let b = model.ObjectID(document.userId);
            console.log("contract update userId -- ", typeof (b), b);
            // console.log("basemap owner id", typeof (t), t);
            requests.push({
              "updateOne": {
                "filter": {"userId": t},
                "update": {"$set": {"userId": b}}
              }
            });
            //requests.push({id: document._id, owner: t});
          }
        }
      }, (err) => {
        try {
          if (requests.length > 0) {
            bw = collection.bulkWrite(requests, {ordered: true});
            console.log("---corn job is done");
          } else {
            console.log("---there is no operations in bulk");
          }
        } catch (e) {
          console.error("bulk operations", e);
        }
        //db.close();
      }
    );
    /* cursor.close();
     cursor.once('end', function () {
     console.log("basemap check request size", requests);
     db.close();
     });*/
  });
};
