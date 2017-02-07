module.exports = getDB();
function getDB() {
  var db = {
    "db": {
      "name": "db",
      "connector": "memory"
    },
    "mysqlDs": {
      "host": "demo.strongloop.com",
      "port": 3306,
      "database": "getting_started_intermediate",
      "username": "demo",
      "password": "L00pBack",
      "name": "mysqlDs",
      "connector": "mysql"
    },
    "mongoDs": {
      "host": "demo.strongloop.com",
      "port": 27017,
      "database": "getting_started_intermediate",
      "username": "demo",
      "password": "L00pBack",
      "name": "mongoDs",
      "connector": "mongodb"
    },
    "storage": {
      "name": "storage",
      "connector": "loopback-component-storage",
      "provider": "filesystem",
      "root": "./storage/tmp/profile"
    },
    "rocket_us_east": {
      "connector": "mongodb",
      "url": process.env.ROCKET_EAST
    },
    "mlabheroku": {
      "connector": "mongodb",
      "url": process.env.MLAB_M1
    },
    "mlabKSdb": {
      "connector": "mongodb",
      "url": process.env.MLAB_M3
    },
    "gmail_data_source": {
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
    }
  };

  console.log('using mongodb');
  return db;
}
