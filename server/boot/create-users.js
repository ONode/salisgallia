"use strict";
module.exports = function (app) {


  return;
  if (process.env.NODE_ENV == "tst") {

    const  User = app.models.user;
    const  Role = app.models.Role;
    const  RoleMapping = app.models.RoleMapping;
    const  Team = app.models.Artist;

    User.create([
      {username: 'John', email: 'john@doe.com', password: 'opensesame'},
      {username: 'Jane', email: 'jane@doe.com', password: 'opensesame'},
      {username: 'Bob', email: 'bob@projects.com', password: 'opensesame'}
    ], function (err, users) {
      if (err) throw err;

      console.log('Created users:', users);

      // create project 1 and make john the owner
      users[0].projects.create({
        name: 'project1',
        balance: 100
      }, function (err, project) {
        if (err) throw err;

        console.log('Created project:', project);

        // add team members
        Team.create([
          {ownerId: project.ownerId, memberId: users[0].id},
          {ownerId: project.ownerId, memberId: users[1].id}
        ], function (err, team) {
          if (err) throw err;

          console.log('Created team:', team);
        });
      });

      //create project 2 and make jane the owner
      users[1].projects.create({
        name: 'project2',
        balance: 100
      }, function (err, project) {
        if (err) throw err;

        console.log('Created project:', project);

        //add team members
        Team.create({
          ownerId: project.ownerId,
          memberId: users[1].id
        }, function (err, team) {
          if (err) throw err;

          console.log('Created team:', team);
        });
      });

      //create the admin role
      Role.create({
        name: 'admin'
      }, function (err, role) {
        if (err) throw err;

        console.log('Created role:', role);

        //make bob an admin
        role.principals.create({
          principalType: RoleMapping.USER,
          principalId: users[2].id
        }, function (err, principal) {
          if (err) throw err;

          console.log('Created principal:', principal);
        });
      });
    });

  }
};
