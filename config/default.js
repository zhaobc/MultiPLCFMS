module.exports = {
  mysql: { // mysql数据库
    host: '127.0.0.1',
    user: 'flungle',
    password: '123456',
    database: 'palcan_multi_datacenter',//当前数据库
    port: 3306,
    useConnectionPooling: true
  },
  users_table:'user_tbl'
}

//使用连接池aliyun
// var mysql = require('mysql');
// var pool = mysql.createPool({
//     host: '47.96.27.232',
//     user: 'flungle',
//     password: '041112Qj',
//     database:'palcan_datacenter'
// });

// module.exports = function(sql, callback) {
//     pool.getConnection(function(conn_err, conn) {
//         if(conn_err) {
//             callback(err,null,null);
//         } else {
//             conn.query(sql, function(query_err, rows, fields) {
//                 conn.release();
//                 callback(query_err, rows, fields);
//             });
//         }
//     });
// };