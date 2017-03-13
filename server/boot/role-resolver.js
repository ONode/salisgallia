/**
 * Created by hesk on 8/3/2017.
 */
"use strict";
module.exports = function(app) {
  const Role = app.models.Role;

  Role.registerResolver('teamMember', function(role, context, cb) {
    function reject() {
      process.nextTick(function() {
        cb(null, false);
      });
    }

    // if the target model is not project
    if (context.modelName !== 'project') {
      return reject();
    }

    // do not allow anonymous users
    const  userId = context.accessToken.userId;
    if (!userId) {
      return reject();
    }

    // check if userId is in team table for the given project id
    context.model.findById(context.modelId, function(err, project) {
      if (err || !project)
        return reject();

      const  Team = app.models.Team;
      Team.count({
        ownerId: project.ownerId,
        memberId: userId
      }, function(err, count) {
        if (err) {
          console.log(err);
          return cb(null, false);
        }

        cb(null, count > 0); // true = is a team member
      });
    });
  });
};
