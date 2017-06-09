"use strict";
function getDB() {
  const ____db = {
    "db": {
      "name": "db",
      "connector": "memory"
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
      "url": process.env.POSTGRESQL_PL_REL
    }
  };
  console.log('using production datasource');
  return ____db;
}
module.exports = getDB();
