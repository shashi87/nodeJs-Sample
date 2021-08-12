var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var flash=require("connect-flash");
var models = require("./app/models");
var trimBody = require('connect-trim-body');
var cors = require('cors');
// Grab sessions
var fs = require('fs');
var path = require('path');
var dirPath = __dirname   +"/public/uploads";
var dirPath2 = __dirname   +"/public/uploads/100X100";
fs.access(dirPath, function(err) {
    if (err) {
        fs.mkdirSync(dirPath);
        fs.mkdirSync(dirPath2);
    }else{
        fs.access(dirPath2, function(err2) {
            if(err2){
                fs.mkdirSync(dirPath2);
            }
        })
    }
});

var app = express();


// view engine setup
app.set('views', path.join(__dirname, 'public'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json({limit: '50mb'}));
/*app.use(bodyParser.urlencoded({
  extended: true
}));*/
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

app.use(function(req, res, next) {
    res.set('X-Frame-Options', 'Deny');
    
    next();
});
//app.use(cors());
app.use(trimBody());(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: "LifeShareCare",
  proxy: true,
  resave: true,
  saveUninitialized: true
}));

app.use(flash());


// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   var err = new Error('Not Found');
//   err.status = 404;
//   next(err);
// });

// error handlers

// development error handler
// will print stacktrace
// if (app.get('env') === 'development') {
//   app.use(function(err, req, res, next) {
//     res.status(err.status || 500);
//     res.render('error', {
//       message: err.message,
//       error: err
//     });
//   });
// }

// production error handler
// no stacktraces leaked to user
// app.use(function(err, req, res, next) {
//   res.status(err.status || 500);
//   res.render('error', {
//     message: err.message,
//     error: {}
//   });
// });


module.exports = app;
