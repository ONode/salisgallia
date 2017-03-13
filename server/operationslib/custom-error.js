/**
 * Created by zJJ on 7/20/2016.
 */
module.exports = function() {
  return function(err, req, res, next) {
    err = req.app.buildError(err);
    next(err);
  };
};
