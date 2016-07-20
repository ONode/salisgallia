/**
 * Created by zJJ on 7/20/2016.
 */

const logTag = '> save info';
module.exports = function (basemap, result_from_basemap_creation, next) {
  /*  basemap.findOne({
   where: {authorId: req.params.user, slug: req.params.slug},
   include: 'comments'
   }, function (err, record) {
   if (err) res.send(err);
   if (!err && record) {
   res.send(record);
   } else {
   res.send(404);
   }
   });*/
  var saveClip = new basemap(result_from_basemap_creation);
  saveClip.save(function (err) {
    if (err) {
      console.log(logTag, "new basemap error", err);
    } else {
      console.log(logTag, "new basemap success", err);
    }
    next();
  });
};
