/**
 * 主入口启动文件
 */
var express = require('express'); // web 框架
var session = require('express-session');//session
var logger = require('morgan'); // 开发模式下log
var bodyParser = require('body-parser'); // json
var path = require('path'); // 路径
var config = require('config-lite'); // 读取配置文件
var cookieParser = require('cookie-parser');
var winston = require('winston'); // 日志
var expressWinston = require('express-winston'); // 基于 winston 的用于 express 的日志中间件
var routes = require('./routes');

var passport = require('passport');
var flash = require('connect-flash');

// 实例化express
var app = express();

// 设置模板目录
app.set('views', path.join(__dirname, 'views'))
// 设置模板引擎为 ejs
app.set('view engine', 'ejs')

// connect to our database
require('./config/passport')(passport); // pass passport for configuration

// log
app.use(logger('dev'))

app.use(cookieParser()); // read cookies (needed for auth)

// 设置json
// 格式化JSON的输出
app.set('json spaces', 2)
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
  extended: false
}))
// parse application/json
app.use(bodyParser.json())

// 设置静态文件目录
app.use(express.static(path.join(__dirname, 'public'))); // 注意：中间件的加载顺序很重要。如上面设置静态文件目录的中间件应该放到 routes(app) 之前加载，这样静态文件的请求就不会落到业务逻辑的路由里。

// required for passport
app.use(session({
  secret: 'vidyapathaisalwaysrunning',
  resave: true,
  saveUninitialized: true
})); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

//设置路由
app.use(express.Router(routes));

// 错误请求的日志
app.use(expressWinston.errorLogger({
  transports: [
    new winston.transports.Console({
      json: true,
      colorize: true
    }),
    new winston.transports.File({
      filename: 'logs/error.log'
    })
  ]
}))

routes(app, passport);

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})

// app
module.exports = app