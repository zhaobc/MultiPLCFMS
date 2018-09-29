/**
 * routes/index.js
 */

var deviceDao = require("../dao/deviceDao");
/* GET home page. */
module.exports = function (app, passport) {

    //登录
    //method:get
    app.get('/', function (req, res) {
        res.render('login', { message: req.flash('loginMessage') });
    });

    //登录
    //method:get
    app.get('/login', function (req, res) {
        // render the page and pass in any flash data if it exists
        res.render('login', { message: req.flash('loginMessage') });
    });

    // process the login form(Reserve functions)
    //method:post
    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/vehicleList', // redirect to the secure profile section
        failureRedirect: '/login', // redirect back to the signup page if there is an error
        failureFlash: true// allow flash messages
    }),
        function (req, res) {
            res.redirect('/');
        }
    );

    //minimum test page
    //method:get
    app.get('/test', function (req, res) {
        res.render("test", { title: "test page" });
    });

    //新多机控制页
    //method:get
    app.get('/multiDevicesInfo', isLoggedIn, function (req, res) {
        res.render("multiDevicesInfo", {title: "multiDeviceInfo"});
        //deviceDao.severalDevicesInfo(req, res);
    });

    //十五分钟数据
    //method:post
    app.post('/getFifteenMinutesData/(:id)', isLoggedIn, function (req, res) {
        deviceDao.getFifteenMinutesData(req, res);
    });

    //多机控制
    //method:get
    //url：/devicesInfo/car001/(:id) cell001
    app.get('/devicesInfo4/:vid/:id', isLoggedIn, function (req, res) {
        deviceDao.getCellInfo(req,res);
    });

    //编辑燃料电池
    //method:get
    //url:/editfuelcell/(:guid)
    app.get("/editfuelcell/(:guid)",isLoggedIn,function(req,res){
        deviceDao.showFuelCellInfo(req,res);
    });

    //编辑燃料电池
    //method:post
    //url:/editfuelcell/(:guid)
    app.post("/editfuelcell/(:guid)",isLoggedIn,function(req,res){
        deviceDao.editFuelCell(req,res);
    });

    //删除
    //method:post
    //url:/deletefuelcell/(:guid)
    app.post("/deletefuelcell/(:guid)",isLoggedIn,function(req,res){
        deviceDao.deleteFuelCell(req,res);
    });
    
    //多机汇总页面
    //method:get
    app.get('/OneVehicleCellsInfo/(:vid)', isLoggedIn, function (req, res) {
        deviceDao.getOneVehicleCellsInfo(req,res);
    });

    //请求一个小时数据
    //method:post
    app.post('/getOneHourData/(:id)', isLoggedIn, function(req,res){
        deviceDao.getOneHourData(req,res);
    });

    //获取device的数据
    //method:post
    app.post('/deviceInfo/(:id)', isLoggedIn, function (req, res, next) {
        deviceDao.getDeviceInfo(req, res, next);
    });

    //显示设备列表
    //method:get
    app.get('/vehicleList', isLoggedIn, function (req, res, next) {
        deviceDao.queryAll(req, res, next);
    });

    //设备信息
    //method:get
    app.get('/multiDevicesInfo/(:id)', isLoggedIn, function (req, res) {
        res.render('multiDevicesInfo', { items: req.user });
    });

    //修改密码
    //method:get
    app.get('/updatePassword', isLoggedIn, function (req, res, next) {
        res.render('updatePassword', { message: req.flash('updateMessage') });
    });

    //修改密码
    //method:post
    app.post('/updatePassword', isLoggedIn, function (req, res, next) {
        deviceDao.updatePassword(req, res, next);
    });

    //添加燃料电池
    //method:add
    app.get('/addfuelcell', isLoggedIn, function (req, res) {
        deviceDao.showVehicleInfo(req,res);
    });

    //添加燃料电池
    //method:post
    app.post('/addfuelcell', isLoggedIn, function (req, res, next) {
        deviceDao.addFuelCell(req, res, next);
    });

    //添加容器
    //method:add
    app.get('/addvehicle', isLoggedIn, function (req, res) {
        deviceDao.showCompanyInfo(req,res);
    });

    //添加容器
    //method:post
    app.post('/addvehicle', isLoggedIn, function (req, res, next) {
        deviceDao.addVehicle(req, res, next);
    });

    //添加公司
    //method:add
    app.get('/addcompany', isLoggedIn, function (req, res) {
        res.render('AddCompany', {title:"AddCompany"});
    });

    //添加公司
    //method:post
    app.post('/addcompany', isLoggedIn, function (req, res, next) {
        deviceDao.addCompany(req, res, next);
    });

    //添加用户
    //method:add
    app.get('/adduser', isLoggedIn, function (req, res) {
        deviceDao.showUserInfo(req,res);
    });

    //添加公司
    //method:post
    app.post('/adduser', isLoggedIn, function (req, res, next) {
        deviceDao.addUser(req, res, next);
    });

    //注册
    //show the signup form
    app.get('/signup', function (req, res) {
        // render the page and pass in any flash data if it exists
        res.render('signup.ejs', { message: req.flash('signupMessage') });
    });

    //退出登录
    //method:get
    app.get('/logout', function (req, res) {
        deviceDao.recoverDeviceInfo(req, res);
        req.logout();
        res.redirect('/');
    });

    app.get("/error", function (req, res) {
        res.render('error', { items: req.user });
    });

    function isLoggedIn(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        res.redirect('/');
    };

    //require Gid
    function requireGid(req, res, next) {
        if (req.user && req.user.gid != 0) {
            next();
        }
        else {
            res.send(404);
        }
    }
}