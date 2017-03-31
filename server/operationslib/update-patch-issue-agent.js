/**
 * Created by hesk on 13/3/2017.
 */
module.exports = function (app, cb) {
  console.log("update batch job convert object id into string id to adapt the new updates");
  console.log("--start working Issue");
  let requests = [], tst_subject_db;
  let modelname = "Issue";
  let model = app.models.Issue.getDataSource();

  //please select the database location -- production
  tst_subject_db = app.datasources.rocket_us_east;

  // tst_subject_db = app.datasources.rocket_us_east;


  tst_subject_db.connector.connect(function (err, db) {
    let collection = db.collection(modelname);
    let where = {};
    //where[fk_field] = patch_to_ensure_monogodb_id(persistentModel, fk_id);
    let cursor = collection.find(where);
    console.log("subject_id collection.find", where);
    let bw = {};
    cursor.forEach(document => {
        console.log("subject_id forEach", document);
        //  let document = cursor.next();
        if (document.from_agent_id) {
          // console.log("basemap owner id", typeof (document.owner));
          if (typeof (document.from_agent_id) == 'string') {
            let t = String(document.from_agent_id);
            let b = model.ObjectID(document.from_agent_id);
            console.log("subject_id check", typeof (b), b);
            requests.push({
              "updateOne": {
                "filter": {"_id": document._id},
                "update": {"$set": {"from_agent_id": b}}
              }
            });
            //requests.push({id: document._id, owner: t});
          }
        }
      }, (err) => {
        console.error("no items? ", err);
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
