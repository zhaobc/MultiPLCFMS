var mysql = require('mysql');
var dbconfig = require('../config/default');
var $util = require('../util/util');
var pool = mysql.createPool($util.extend({}, dbconfig.mysql));
var bcrypt = require('bcrypt-nodejs');
var redis = require("redis");

var jsonStr = {
    'BG': 'd3',
    'FR': 'd4',
    'BR': 'd7',
    'BW': 'd2',
    'GT': 'd1',
    'I': 'd14',
    'V': 'd15',
    'p': 'd27',
    'RP': 'd25',
    'TP': 'd17',
    'TI': 'd8',
    'TO': 'd9'
};

// 向前台返回JSON方法的简单封装
var jsonWrite = function (res, ret) {
    if (typeof ret === 'undefined') {
        res.json({
            code: '1',
            msg: '操作失败'
        });
    } else {
        res.json(ret);
    }
};

//格式化时间
Date.prototype.pattern = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours() % 12 == 0 ? 12 : this.getHours() % 12, //12小时制
        "H+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    var week = {
        "0": "/u65e5",
        "1": "/u4e00",
        "2": "/u4e8c",
        "3": "/u4e09",
        "4": "/u56db",
        "5": "/u4e94",
        "6": "/u516d"
    };
    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    }
    if (/(E+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, ((RegExp.$1.length > 1) ? (RegExp.$1.length > 2 ? "/u661f/u671f" : "/u5468") : "") + week[this.getDay() + ""]);
    }
    for (var k in o) {
        if (new RegExp("(" + k + ")").test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        }
    }
    return fmt;
}

module.exports = {
    //获取设备列表
    queryAll: function (req, res, next) {
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log('[CANNOT CREATE CONNECTION ERROR] - ', err.message);
                return;
            }
            connection.query('SELECT t1.id,t1.guid,t1.alias,t1.online,t2.name FROM palcan_multi_datacenter.vehicle_info_tbl as t1 left join palcan_multi_datacenter.company_info_tbl as t2 on t1.cid=t2.id;', function (err, result) {
                console.log("invoked[readComment]");
                for (var i = 0; i < result.length; i++) {
                    result[i].gid = req.user.gid;
                }
                res.render('vehicleList', {
                    items: result
                });
                connection.release();
            });
        })
    },
    //获取车辆（容器）列表
    getOneVehicleCellsInfo: function (req, res) {
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log('[CANNOT CREATE CONNECTION ERROR] - ', err.message);
                return;
            }
            connection.query("select id from palcan_multi_datacenter.vehicle_info_tbl where guid=?;", [req.params.vid], function (err, result) {
                if (err) {
                    console.log('SELECT id from palcan_multi_datacenter.vehicle_info_tbl ERROR - ', err.message);
                    return;
                }
                connection.query("select * from palcan_multi_datacenter.cell_info_tbl as t1 where vid=?;", [result[0].id], function (err, rows) {
                    if (err) {
                        console.log('SELECT GUID ERROR - ', err.message);
                        return;
                    }

                    if (rows.length) {
                        rows.forEach(function (row) {
                            row.vname = req.params.vid;
                        });
                        res.render('OneVehicleCellsInfo', {
                            items: rows
                        });
                    }
                    connection.release();
                })
            })
        })
    },
    //添加燃料电池
    addFuelCell: function (req, res, next) {
        var devGetSql = 'SELECT * FROM cell_info_tbl where guid=?;';
        //查询guid是否存在
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log('[CANNOT CREATE CONNECTION ERROR] - ', err.message);
                return;
            }
            connection.query(devGetSql, req.body.guid, function (err, result) {
                if (err) {
                    throw err;
                }
                if (result.length) {
                    return req.flash({
                        "errorMessage": 'guid已存在'
                    });
                } else {
                    //增加设备SQL
                    var deviceAddSql = 'INSERT INTO cell_info_tbl (guid,alias,vid,uid) VALUES (?,?,?,?);';
                    var deviceData = [req.body.guid, req.body.alias, req.body.vid, req.user.id];
                    connection.query(deviceAddSql, deviceData, function (err, result) {
                        if (err) {
                            console.log('[INSEET INTO DATA ERROR] - ', err.message);
                            return;
                        }
                        //建表
                        var deviceCreateSql = 'Create Table if not exists ' + req.body.guid + '_plcfms_tbl(id int unsigned not null primary key auto_increment,sendtime datetime,d1 double,d2 double,d3 double,d4 double,d5 double,d6 double,d7 double,d8 double,d9 double,d10 double,d11 double,d12 double,d13 double,d14 double,d15 double,d16 int unsigned,d17 int unsigned,d18 double,d19 double,d20 int unsigned,d21 int unsigned,d22 int unsigned,d23 int unsigned,d24 int unsigned,d25 int unsigned,d26 int unsigned,d27 int unsigned,d28 int unsigned,d29 int unsigned,d30 int unsigned,d31 int unsigned,d32 int unsigned,d33 int unsigned,d34 int unsigned,d35 int unsigned,d36 int unsigned,d37 int unsigned,d38 int unsigned,d39 int unsigned,d40 int unsigned);';
                        connection.query(deviceCreateSql, function (err, result) {
                            if (err) {
                                console.log('[CREATE TABLE ERROR] - ', err.message);
                                return;
                            }
                            //错误检查
                            connection.commit(function (err) {
                                if (err) {
                                    return connection.rollback(function () {
                                        throw err;
                                    });
                                }
                                console.log('success!');
                            });
                            res.redirect("/vehicleList");
                        });
                    });
                    connection.release();
                }
            });
        });
    },
    //编辑燃料电池信息页面
    showFuelCellInfo: function (req, res) {
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log('[CANNOT CREATE CONNECTION ERROR] - ', err.message);
                return;
            }
            connection.query("select * from palcan_multi_datacenter.cell_info_tbl where guid=?;", [req.params.guid], function (err, rows) {
                if (err) {
                    console.log('SELECT GUID ERROR - ', err.message);
                    return;
                }
                if (rows.length) {
                    res.render('EditFuelCell', {
                        items: rows
                    });
                }
                connection.release();
            })
        })
    },
    //编辑燃料电池（post）
    editFuelCell:function(req,res){
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log('[CANNOT CREATE CONNECTION ERROR] - ', err.message);
                return;
            }
            connection.query("update palcan_multi_datacenter.cell_info_tbl set alias=? where guid=?;", [req.body.alias,req.params.guid], function (err, rows) {
                if (err) {
                    console.log('SELECT GUID ERROR - ', err.message);
                    return;
                }
                //错误检查
                connection.commit(function (err) {
                    if (err) {
                        return connection.rollback(function () {
                            throw err;
                        });
                    }
                    console.log('success!');
                });
                res.redirect("/vehicleList");
                connection.release();
            })
        })
    },
    //删除燃料电池（post）
    deleteFuelCell: function(req,res){
        pool.getConnection(function(err,connection){
            if(err){
                console.log('[CANNOT CREATE CONNECTION ERROR] - ', err.message);
                return;
            }
            connection.query("select * from palcan_multi_datacenter.cell_info_tbl where guid=?;", [req.params.guid], function (err, rows) {
                if (err) {
                    console.log('SELECT GUID ERROR - ', err.message);
                    return;
                }
                connection.query('delete * FROM palcan_multi_datacenter.cell_info_tbl where guid=?;', [req.params.guid], function (err, result) {
                    res.redirect("/vehicleList");
                    connection.release();
                });
            })
        })
    },
    //显示车辆信息页面
    showVehicleInfo: function (req, res) {
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log('[CANNOT CREATE CONNECTION ERROR] - ', err.message);
                return;
            }
            connection.query('SELECT t1.id,t1.guid FROM palcan_multi_datacenter.vehicle_info_tbl as t1', function (err, result) {
                console.log("invoked[readComment]");
                res.render('AddFuelCell', {
                    items: result
                });
                connection.release();
            });
        })
    },
    //添加容器
    addVehicle: function (req, res, next) {
        var vehGetSql = 'SELECT * FROM vehicle_info_tbl where guid=?;';
        //查询guid是否存在
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log('[CANNOT CREATE CONNECTION ERROR] - ', err.message);
                return;
            }
            connection.query(vehGetSql, req.body.guid, function (err, result) {
                if (err) {
                    throw err;
                }
                if (result.length) {
                    // return req.flash({
                    //     "errorMessage": 'guid已存在'
                    // });
                    res.redirect("/vehicleList");
                } else {
                    //增加容器SQL
                    var vehAddSql = 'INSERT INTO vehicle_info_tbl (guid,alias,online,cid) VALUES (?,?,?,?);';
                    var vehData = [req.body.guid, req.body.alias, 0, req.body.cid];
                    connection.query(vehAddSql, vehData, function (err, result) {
                        if (err) {
                            console.log('[INSEET INTO DATA ERROR] - ', err.message);
                            return;
                        }
                        //建表
                        var vehGPSCreateSql = 'Create Table if not exists ' + req.body.guid + '_gps_tbl(id int unsigned not null primary key auto_increment,sendtime datetime,latitude double,longtitude double);';
                        connection.query(vehGPSCreateSql, function (err, result) {
                            if (err) {
                                console.log('[CREATE TABLE ERROR] - ', err.message);
                                return;
                            }
                            //错误检查
                            connection.commit(function (err) {
                                if (err) {
                                    return connection.rollback(function () {
                                        throw err;
                                    });
                                }
                                console.log('success!');
                            });
                            res.redirect("/vehicleList");
                        });
                    });
                    connection.release();
                }
            });
        });
    },
    //get addvehicle页面
    showCompanyInfo: function (req, res) {
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log('[CANNOT CREATE CONNECTION ERROR] - ', err.message);
                return;
            }
            connection.query('SELECT t1.id,t1.name FROM palcan_multi_datacenter.company_info_tbl as t1', function (err, result) {
                console.log("invoked[readComment]");
                res.render('AddVehicle', {
                    items: result
                });
                connection.release();
            });
        })
    },
    //添加公司
    addCompany: function (req, res, next) {
        var comGetSql = 'SELECT * FROM company_info_tbl where name=?;';
        //查询guid是否存在
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log('[CANNOT CREATE CONNECTION ERROR] - ', err.message);
                return;
            }
            connection.query(comGetSql, req.body.name, function (err, result) {
                if (err) {
                    throw err;
                }
                if (result.length) {
                    // return req.flash({
                    //     "errorMessage": 'guid已存在'
                    // });
                    res.redirect("/vehicleList");
                } else {
                    //增加容器SQL
                    var comAddSql = 'INSERT INTO company_info_tbl (name,abbr) VALUES (?,?);';
                    var comData = [req.body.name, req.body.abbr];
                    connection.query(comAddSql, comData, function (err, result) {
                        if (err) {
                            console.log('[INSEET INTO DATA ERROR] - ', err.message);
                            return;
                        }
                        //错误检查
                        connection.commit(function (err) {
                            if (err) {
                                return connection.rollback(function () {
                                    throw err;
                                });
                            }
                            console.log('success!');
                        });
                        res.redirect("/vehicleList");
                    });
                    connection.release();
                }
            });
        });
    },
    //showUserInfo
    showUserInfo: function (req, res) {
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log('[CANNOT CREATE CONNECTION ERROR] - ', err.message);
                return;
            }
            connection.query('SELECT t1.id,t1.abbr FROM palcan_multi_datacenter.company_info_tbl as t1', function (err, result) {
                console.log("invoked[readComment]");
                res.render('AddUser', {
                    items: result
                });
                connection.release();
            });
        })
    },
    //添加公司
    addUser: function (req, res, next) {
        var userGetSql = 'SELECT * FROM user_tbl where name=?;';
        //查询guid是否存在
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log('[CANNOT CREATE CONNECTION ERROR] - ', err.message);
                return;
            }
            connection.query(userGetSql, req.body.name, function (err, result) {
                if (err) {
                    throw err;
                }
                if (result.length) {
                    // return req.flash({
                    //     "errorMessage": 'guid已存在'
                    // });
                    res.redirect("/vehicleList");
                } else {
                    //增加用户SQL
                    var userAddSql = 'INSERT INTO palcan_multi_datacenter.user_tbl (name,password,gid,cid) VALUES (?,?,?,?);';
                    var pwdStr = '123456';
                    var password = bcrypt.hashSync(pwdStr, null, null);
                    var userData = [req.body.name, password, 100, req.body.cid];
                    connection.query(userAddSql, userData, function (err, result) {
                        if (err) {
                            console.log('[INSEET INTO DATA ERROR] - ', err.message);
                            return;
                        }
                        //错误检查
                        connection.commit(function (err) {
                            if (err) {
                                return connection.rollback(function () {
                                    throw err;
                                });
                            }
                            console.log('success!');
                        });
                        res.redirect("/vehicleList");
                    });
                    connection.release();
                }
            });
        });
    },
    //改用redis获取设备信息
    getDeviceData: function(req,res){
        var client = redis.createClient("6379", "10.0.12.64");

        client.on("error", function (error) {
            console.log("Redis Error:"+error);
        });
                
        client.auth("123456", function () {
            console.log("auth success.");
        });
        
        client.lpop(req.params.id,function(req,object){
            
            var cellDataArr=[];
            if(object){
                var objJson=JSON.parse(object);

                var dateTime=new Date(objJson.datetime).pattern("HH:mm");
                var currentDateTime =new Date(objJson.datetime).pattern("yyyy-MM-dd HH:mm:ss");
                objJson.data.unshift(dateTime);
                objJson.data.push(currentDateTime);
                var json = {
                    "jsonArr": objJson.data
                };
            }else{
                console.error("ObjJson is null");
            }
            jsonWrite(res, json);
        })
    },
    //设备信息
    getDeviceInfo: function (req, res, next) {
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log('[CANNOT CREATE CONNECTION ERROR] - ', err.message);
                return;
            }
            connection.query("select * from palcan_multi_datacenter." + req.params.id + "_plcfms_tbl order by id desc LIMIT 1;", function (err, result) {
                if (err) {
                    console.log('[CANNOT QUERY DATA ERROR] - ', err.message);
                    return;
                }
                var jsonArr = new Array();
                var json = {
                    "jsonArr": jsonArr
                };
                if (result.length) {
                    jsonArr[41] = result[0].sendtime.pattern("yyyy-MM-dd HH:mm:ss");
                    jsonArr[0] = result[0].sendtime.pattern("HH:mm");
                    jsonArr[1] = result[0].d1;
                    jsonArr[2] = result[0].d2;
                    jsonArr[3] = result[0].d3;
                    jsonArr[4] = result[0].d4;
                    jsonArr[5] = result[0].d5;
                    jsonArr[6] = result[0].d6;
                    jsonArr[7] = result[0].d7;
                    jsonArr[8] = result[0].d8;
                    jsonArr[9] = result[0].d9;
                    jsonArr[10] = result[0].d10;
                    jsonArr[11] = result[0].d11;
                    jsonArr[12] = result[0].d12;
                    jsonArr[13] = result[0].d13;
                    jsonArr[14] = result[0].d14;
                    jsonArr[15] = result[0].d15;
                    jsonArr[16] = result[0].d16;
                    jsonArr[17] = result[0].d17;
                    jsonArr[18] = result[0].d18;
                    jsonArr[19] = result[0].d19;
                    jsonArr[20] = result[0].d20;
                    jsonArr[21] = result[0].d21;
                    jsonArr[22] = result[0].d22;
                    jsonArr[23] = result[0].d23;
                    jsonArr[24] = result[0].d24;
                    jsonArr[25] = result[0].d25;
                    jsonArr[26] = result[0].d26;
                    jsonArr[27] = result[0].d27;
                    jsonArr[28] = result[0].d28;
                    jsonArr[29] = result[0].d29;
                    jsonArr[30] = result[0].d30;
                    jsonArr[31] = result[0].d31;
                    jsonArr[32] = result[0].d32;
                    jsonArr[33] = result[0].d33;
                    jsonArr[34] = result[0].d34;
                    jsonArr[35] = result[0].d35;
                    jsonArr[36] = result[0].d36;
                    jsonArr[37] = result[0].d37;
                    jsonArr[38] = result[0].d38;
                    jsonArr[39] = result[0].d39;
                    jsonArr[40] = result[0].d40;
                    jsonWrite(res, json);
                    connection.release();
                } else {
                    jsonWrite(res, json);
                    connection.release();
                }
            });
        })
    },
    //获取一个车辆的电堆数据，显示在devicesInfo4.ejs页面
    getCellInfo: function (req, res) {
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log('[CANNOT CREATE CONNECTION ERROR] - ', err.message);
                return;
            }
            connection.query("select id from palcan_multi_datacenter.vehicle_info_tbl where guid=?;", [req.params.vid], function (err, result) {
                if (err) {
                    console.log('SELECT id from palcan_multi_datacenter.vehicle_info_tbl ERROR - ', err.message);
                    return;
                }

                connection.query("select * from palcan_multi_datacenter.cell_info_tbl where vid=?;", [result[0].id], function (err, rows) {
                    if (err) {
                        console.log('SELECT GUID ERROR - ', err.message);
                        return;
                    }
                    if (rows.length) {
                        rows.forEach(function (row) {
                            row.vname = req.params.vid;
                        });
                        res.render('devicesInfo4', {
                            items: rows
                        });
                    }
                    connection.release();
                })
            })
        })
    },
    //getFifteenMinutesData
    getFifteenMinutesData: function (req, res) {
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log('[CANNOT CREATE CONNECTION ERROR] - ', err.message);
                return;
            }

            var date = new Date();
            var dateDay = date.pattern("yyyy-MM-dd ");
            var requiredTimeStamp = dateDay + req.body.timestamp + ":00"; //获取当前的时间
            //var requiredTimeStamp="2018-07-06 "+req.body.timestamp+":00";//模拟7月6日的时间

            var regEx = new RegExp("\\-", "gi");
            requiredTimeStamp = requiredTimeStamp.replace(regEx, "/");

            getRequiredTimeMilliSeconds = Date.parse(requiredTimeStamp);

            var queryTimeStamp1 = getRequiredTimeMilliSeconds - 480 * 1000; //时间8分钟前值毫秒数
            var queryTimeStamp2 = getRequiredTimeMilliSeconds + 480 * 1000; //时间8分钟后值毫秒数

            queryTimeStamp1 = new Date(queryTimeStamp1);
            queryTimeStamp1 = queryTimeStamp1.pattern("yyyy-MM-dd HH:mm:ss");
            queryTimeStamp2 = new Date(queryTimeStamp2);
            queryTimeStamp2 = queryTimeStamp2.pattern("yyyy-MM-dd HH:mm:ss");
            connection.query("select sendtime," + jsonStr[req.body.series] + " from palcan_multi_datacenter." + req.params.id + "_plcfms_tbl where sendtime between '" + queryTimeStamp1 + "' and '" + queryTimeStamp2 + "';", function (err, result) {
                if (err) {
                    console.log('SELECT GUID ERROR - ', err.message);
                    return;
                }
                if (result.length) {
                    result = JSON.stringify(result);
                    result = JSON.parse(result);
                    var timeArr = new Array();
                    var dataArr = new Array();
                    for (var i = 0; i < result.length; i++) {
                        var fifteenMinutesTimeStamp = new Date(result[i].sendtime);
                        timeArr.push(fifteenMinutesTimeStamp.pattern("HH:mm"));
                        dataArr.push(result[i][jsonStr[req.body.series]]);
                    }
                    var json = {
                        date: timeArr,
                        data: dataArr
                    };
                    jsonWrite(res, json);
                    connection.release();
                } else {
                    var json = {
                        date: [],
                        data: []
                    };
                    jsonWrite(res, json);
                    connection.release();
                }
            })
        })
    },
    /*一个小时数据*/
    getOneHourData: function (req, res) {
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log('[CANNOT CREATE CONNECTION ERROR] - ', err.message);
                return;
            }
            var requiredTimeStamp = req.body.timestamp;

            connection.query("select sendtime," + jsonStr[req.body.series] + " from palcan_multi_datacenter." + req.params.id + "_plcfms_tbl where sendtime < '" + requiredTimeStamp + "' order by id desc limit 3600;", function (err, result) {
                if (err) {
                    console.log('SELECT GUID ERROR - ', err.message);
                    return;
                }
                if (result.length) {
                    //console.log("rows---------------"+JSON.stringify(result));
                    result = JSON.stringify(result);
                    result = JSON.parse(result);
                    var timeArr = new Array();
                    var dataArr = new Array();
                    for (var i = 0; i < result.length; i++) {
                        //console.log("result[i].sendtime---------------"+result[i]);
                        var fifteenMinutesTimeStamp = new Date(result[result.length - i - 1].sendtime);
                        timeArr.push(fifteenMinutesTimeStamp.pattern("HH:mm"));
                        dataArr.push(result[result.length - i - 1][jsonStr[req.body.series]]);
                    }
                    var json = {
                        date: timeArr,
                        data: dataArr
                    };
                    jsonWrite(res, json);
                    connection.release();
                } else {
                    var json = {
                        date: [],
                        data: []
                    };
                    jsonWrite(res, json);
                    connection.release();
                }
            })
        })
    },
    //get several Devices Info
    severalDevicesInfo: function (req, res) {
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log('[CANNOT CREATE CONNECTION ERROR] - ', err.message);
                return;
            }
            connection.query("select id from palcan_multi_datacenter.vehicle_info_tbl where guid=?;", [req.params.id], function (err, rows) {
                if (err) {
                    console.log('SELECT ID ERROR vehicle_info_tbl - ', err.message);
                    return;
                }
                if (rows.length) {
                    connection.query("select * from palcan_multi_datacenter.cell_info_tbl where vid=?;", [rows[0].id], function (err, result) {
                        if (err) {
                            console.log('SELECT ID ERROR vehicle_info_tbl - ', err.message);
                            return;
                        }
                        //当前用户控制之后，其他用户不能控制
                        connection.query("update palcan_multi_datacenter.cell_info_tbl set uid=? where vid=?;", [req.user.id, rows[0].id], function (err, result) {
                            if (err) {
                                console.log('[UPDATE UID ERROR] - ', err.message);
                                return;
                            }
                        })
                        res.render('multiDevicesInfo', {
                            user: req.user,
                            guid: req.params.id,
                            items: result
                        });
                        //connection.release();
                    })
                } else {
                    res.redirect("/error");
                }
                connection.release();
            })
        })
    },
    //update device uid
    updateDeviceInfo: function (req, res) {
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log('[CANNOT CREATE CONNECTION ERROR] - ', err.message);
                return;
            }
            connection.query("select * from palcan_multi_datacenter.vehicle_info_tbl where guid=?;", [req.params.id], function (err, rows) {
                if (err) {
                    console.log('SELECT GUID ERROR - ', err.message);
                    return;
                }
                if (rows.length) {
                    connection.query("update palcan_multi_datacenter.vehicle_info_tbl set uid=? where guid=?;", [req.user.uid, req.params.id], function (err, result) {
                        if (err) {
                            console.log('[UPDATE UID ERROR] - ', err.message);
                            return;
                        }
                        connection.release();
                    })
                    res.render('deviceInfo', {
                        items: req.user
                    });
                } else {
                    res.redirect("/error");
                }
            })
        })
    },
    //手动控制
    manualDeviceControl: function (req, res) {
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log('[CANNOT CREATE CONNECTION ERROR] - ', err.message);
                return;
            }
            connection.query("select * from palcan_multi_datacenter.device_info_tbl where guid=?;", [req.params.id], function (err, rows) {
                if (err) {
                    console.log('SELECT GUID ERROR - ', err.message);
                    return;
                }
                if (rows.length) {
                    connection.query("update palcan_multi_datacenter.device_info_tbl set uid=? where guid=?;", [req.user.uid, req.params.id], function (err, result) {
                        if (err) {
                            console.log('[UPDATE UID ERROR] - ', err.message);
                            return;
                        }
                        connection.release();
                    })
                    res.render('manual', {
                        items: req.user
                    });
                } else {
                    res.redirect("/error");
                }
            })
        })
    },
    //recover device uid
    recoverDeviceInfo: function (req, res) {
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log('[CANNOT CREATE CONNECTION ERROR] - ', err.message);
                return;
            }
            connection.query("update palcan_multi_datacenter.cell_info_tbl set uid=? where id=?;", [0, req.params.id], function (err, result) {
                if (err) {
                    console.log('[UPDATE UID ERROR] - ', err.message);
                    return;
                }
                connection.release();
            })
        })
    },
    //更新密码
    updatePassword: function (req, res, next) {
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log('[CANNOT CREATE CONNECTION ERROR] - ', err.message);
                return;
            }
            connection.query("SELECT * FROM palcan_multi_datacenter.user_tbl WHERE name = ?;", [req.user.name], function (err, rows) {
                if (err) {
                    console.log('[SELECT USERNAME ERROR] - ' + err);
                    return;
                }

                if (!rows.length) {
                    return req.flash({
                        'updateMessage': '用户已退出'
                    });
                    // req.flash is the way to set flashdata using connect-flash
                }

                if (!bcrypt.compareSync(req.body.oldpassword, rows[0].password)) {
                    res.redirect("/updatePassword");
                    return req.flash({
                        "updateMessage": '密码不正确'
                    });
                    // create the loginMessage and save it to session as flashdata
                }

                var newpassword = bcrypt.hashSync(req.body.newpassword, null, null);

                connection.query("update palcan_multi_datacenter.user_tbl set password=? where name=?;", [newpassword, req.user.name], function (err, result) {
                    if (err) {
                        console.log('[UPDATE UID ERROR] - ', err.message);
                        return;
                    }
                    req.flash({
                        'updateMessage': '更新成功'
                    });
                    res.redirect("/");
                    connection.release();
                })
            })
        })
    }
}