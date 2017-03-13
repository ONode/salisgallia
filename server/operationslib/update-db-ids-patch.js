/**
 * Created by hesk on 13/3/2017.
 */

module.exports = function (app, cb) {
  console.log("update batch job", "convert object id into string id to adapt the new updates");
  console.log("--start working ...");
  let requests = [];
  let modelname = "Basemap";
  //let tst_subject_db = app.datasources.mlab_test_db;
  let tst_subject_db = app.datasources.mlab_test_db;
  tst_subject_db.connector.connect(function (err, db) {
    let collection = db.collection(modelname);
    let where = {};
    //where[fk_field] = patch_to_ensure_monogodb_id(persistentModel, fk_id);
    let cursor = collection.find(where);
    let updateone = function (_id, owner_id) {
      collection.updateOne({"_id": _id}, {"$set": {"owner": owner_id}});
    };
    let bw = {};
    cursor.forEach(document => {
        //  let document = cursor.next();
        if (document.owner) {
          // console.log("basemap owner id", typeof (document.owner));
          if (typeof (document.owner) == 'object') {
            let t = String(document.owner);
            // console.log("basemap owner id", typeof (t), t);
            requests.push({
              "updateOne": {
                "filter": {"_id": document._id},
                "update": {"$set": {"owner": t}}
              }
            });
            //requests.push({id: document._id, owner: t});
          }
        }
      }, (err) => {
        try {
         // console.log("basemap check request size", requests);
          bw = collection.bulkWrite(requests, {ordered: true});
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
