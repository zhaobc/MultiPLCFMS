// load all the things we need
var LocalStrategy = require('passport-local').Strategy;

// load up the user model
var mysql = require('mysql');
var bcrypt = require('bcrypt-nodejs');
var dbconfig = require('./default');
var $util = require('../util/util');
var connection = mysql.createConnection(dbconfig.mysql);

connection.query('USE ' + dbconfig.mysql.database);

connection.connect(handleError);
connection.on('error', handleError);

function handleError(err) {
    if (err) {
        // 如果是连接断开，自动重新连接
        if (err) {
            connect();
        } else {
            console.error(err.stack || err);
        }
    }
}

// 连接数据库;
function connect() {
    connection = mysql.createConnection(dbconfig.mysql);
    connection.connect(handleError);
    connection.on('error', handleError);
}

connect();

// expose this function to our app using module.exports
module.exports = function (passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function (id, done) {
        connection.query("SELECT * FROM palcan_multi_datacenter.user_tbl WHERE id = ? ;", [id], function (err, rows, fields) {
            if (err)
                return done(err);
            if (rows.length) {
                done(err, rows[0]);
            }
        });
    });

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use(
        'local-signup',
        new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField: 'username',
            passwordField: 'password',
            passReqToCallback: true // allows us to pass back the entire request to the callback
        },
            function (req, username, password, done) {
                // find a user whose email is the same as the forms email
                // we are checking to see if the user trying to login already exists
                //pool.getConnection(function (err, connection) {
                connetction.query("SELECT * FROM palcan_multi_datacenter.user_tbl WHERE name = ? ;", [username], function (err, rows, fields) {
                    if (err)
                        return done(err);
                    if (rows.length) {
                        return done(null, false, req.flash('signupMessage', 'That username is already taken.'));
                    } else {
                        // if there is no user with that username
                        // create the user
                        var newUserMysql = {
                            username: username,
                            password: bcrypt.hashSync(password, null, null)  // use the generateHash function in our user model
                        };

                        var insertQuery = "INSERT INTO user_tbl ( name, password ) values (?,?)";

                        connection.query(insertQuery, [newUserMysql.username, newUserMysql.password], function (err, rows, fields) {
                            //newUserMysql.id = rows.insertId;
                            return done(null, newUserMysql);
                        });
                    }
                });
            })
    );

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use(
        'local-login',
        new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField: 'username',
            passwordField: 'password',
            passReqToCallback: true // allows us to pass back the entire request to the callback
        },
            function (req, username, password, done) { // callback with email and password from our form
                connection.query("SELECT * FROM palcan_multi_datacenter.user_tbl WHERE name = ? ;", [username], function (err, rows, fields) {
                    if (err) {
                        console.log("[passport err]"+err);
                        return done(err);
                    }

                    if (!rows.length) {
                        return done(null, false, req.flash('loginMessage', '用户不存在')); // req.flash is the way to set flashdata using connect-flash
                    }

                    var json = {};

                    // if the user is found but the password is wrong
                    if (!bcrypt.compareSync(password, rows[0].password)) {
                        return done(null, false, req.flash('loginMessage', '密码不正确')); // create the loginMessage and save it to session as flashdata
                    }

                    json.id = rows[0].id;
                    json.name = rows[0].name;
                    json.password = rows[0].password;
                    json.gid = rows[0].gid;

                    return done(null, json);
                });
            })
    );
};