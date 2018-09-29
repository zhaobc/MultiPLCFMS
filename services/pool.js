// dao/userDao.js
// 实现与MySQL交互
var mysql = require('mysql');
var $conf = require('../config/default');
var $util = require('../util/util');

// 使用连接池，提升性能
pool = mysql.createPool($util.extend({}, $conf.mysql));

module.exports=pool;