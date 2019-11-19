var mysql = require('mysql2/promise');
var pool = null;

module.exports = function (config) {
  if (config) {
    pool = mysql.createPool({
      host: config.database.host,
      user: config.database.user,
      password: config.database.pass,
      database: config.database.db,
      waitForConnections: true,
      connectionLimit: 10
    });
  }
  return pool;
};