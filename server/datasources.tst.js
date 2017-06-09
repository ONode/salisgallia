"use strict";
function getDB() {
  const db = {
    "db": {
      "name": "db",
      "connector": "memory"
    },
    "mysqlDs": {
      "name": "mysqlDs",
      "host": "demo.strongloop.com",
      "port": 3306,
      "database": "getting_started_intermediate",
      "username": "demo",
      "password": "L00pBack",
      "connector": "mysql"
    },
    "mongoDs": {
      "name": "mongoDs",
      "host": "demo.strongloop.com",
      "port": 27017,
      "database": "getting_started_intermediate",
      "username": "demo",
      "password": "L00pBack",
      "connector": "mongodb"
    },
    "storage": {
      "name": "storage",
      "connector": "loopback-component-storage",
      "provider": "filesystem",
      "root": "./storage/tmp/profile"
    },
    "rocket_us_east": {
      "name": "rocket_us_east",
      "connector": "mongodb",
      "url": process.env.ROCKET_EAST
    },
    "mlab_test_db": {
      "name": "mlab_test_db",
      "connector": "mongodb",
      "url": process.env.MLAB_M1
    },
    "mlabKSdb": {
      "name": "mlabKSdb",
      "connector": "mongodb",
      "url": process.env.MLAB_M3
    },
    "gmail_data_source": {
      "name": "gmail_data_source",
      "connector": "mail",
      "transports": [
        {
          "type": "smtp",
          "host": "smtp.gmail.com",
          "secure": true,
          "secureConnection": true,
          "port": 465,
          "auth": {
            "user": process.env.GMAIL_USER,
            "pass": process.env.GMAIL_PASS
          }
        }
      ]
    },
    "psql_pl_re": {
      "name": "psql_pl_re",
      "connector": "postgresql",
      "port": 5432,
      "database": "uoridjav",
      "password": "E56D4Y_GzxSSC-inAKobOsF2KZsTeutk",
      "user": "uoridjav",
      "url": process.env.POSTGRESQL_PL_REL
    }
  };

  console.log('using testing datasource');
  return db;
}
module.exports = getDB();
