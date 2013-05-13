
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , partials = require('express-partials');

var fs = require('fs');
var accessLogfile=fs.createWriteStream('access.log',{flags:'a'});
var errorLogfile =fs.createWriteStream('error.log',{flags:'a'});

var app = express();

var MongoStore = require('connect-mongo')(express);
var settings = require('./settings');

var flash = require('connect-flash');

app.configure(function(){
  app.use(express.logger({stream:accessLogfile}));
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(partials());
  app.set('view options',{
      layout: true
  });
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({
    secret: settings.cookieSecret,
    store:  new  MongoStore({
    db: settings.db
    })
  }));
  app.use(flash());
  app.use(function(req, res, next) {
      res.locals.error = req.flash('error').toString();
      res.locals.success = req.flash('success').toString();
      res.locals.user = req.session ? req.session.user : null;
      next();
  });
  app.use(app.router);
  app.use(express. static (__dirname + '/public'));
  app.use(express.favicon());
  app.use(express.logger('dev'));
});

/*app.configure('development', function(){
  app.use(express.errorHandler());
});*/

app.configure('production', function(){
    app.error(function (err, req, res, next){
        var meta='['+new Date()+']'+req.url+'\n';
        errorLogfile.write(meta+err.stack+'\n');
        next();
    });
});

routes(app);

if (!module.parent){
    http.createServer(app).listen(app.get('port'), function(){
      console.log("Express server listening on port " + app.get('port'));
        console.log(process.env.NODE_ENV);
    });
}