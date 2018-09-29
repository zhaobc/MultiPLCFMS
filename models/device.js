// var Sequelize = require('sequelize'); // 引入sequelize
// var Mysql = require('mysql')
// var device="all_info_tbl";
// // 定义Device设备表

// var Device = Mysql.define(device, {
//   guid: { // 使用guid
//     type: Sequelize.UUID,
//     allowNull: false,
//     primaryKey: true,
//     //defaultValue: Sequelize.UUIDV1
//   },
//   name: { // 设备名
//     type: Sequelize.STRING,
//     allowNull: false,
//     unique: true // 唯一
//   },
//   alias: { //别名
//     type: Sequelize.STRING,
//     allowNull: false
//   },
//   owner: {
//     type: Sequelize.STRING(2), // 限制字符个数
//     allowNull: false
//   }
// }, {
//   freezeTableName: true, // 开启自定义表名
//   tableName: 'device_info_tbl',
//   timestamps: false
// })

// module.exports = Device