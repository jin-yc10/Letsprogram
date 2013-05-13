/*var cluster=require('cluster');
var os=require('os');

var numCPUs =os.cpus().length;
http = require('http');

var workers={};
if (cluster.isMaster){
    cluster.on('death',function(worker){
        delete workers[worker.pid];
        worker = cluster.fork();
        workers[worker.pid]=worker;
    });

    for(var i=0;i<numCPUs;i++){
        var worker =cluster.fork();
        workers[worker.pid]=worker;
    }
}else{
    var app=require('./app');
    http.createServer(app).listen(3000);
}

process.on('SIGTERM',function(){
    for(var pid in workers){
        process.kill(pid);
    }
    process.exit(0);
});*/
var path = require('path');
var http = require('http');
var cluster = require('cluster');
var NODE_ENV = process.env.NODE_ENV || 'production';
var appName = path.basename(__dirname);
var numCPUs = require('os').cpus().length;
if (cluster.isMaster) {
    process.title = appName + ' master';
    console.log(process.title, 'started');
    // 根据 CPU 个数来启动相应数量的 worker
    for (var i = 0; i < numCPUs; i++)
    {
        cluster.fork();
    }
    process.on('SIGHUP', function() {
        // master 进程忽略 SIGHUP 信号
        });
    cluster.on('death', function(worker)
    {
        console.log(appName, 'worker', '#' + worker.pid, 'died');
        cluster.fork();
    });
} else {
    process.title = appName + ' worker ' + process.env.NODE_WORKER_ID;
    console.log(process.title, '#' + process.pid, 'started');
    process.on('SIGHUP', function() {
        // 接收到 SIGHUP 信号时，关闭 worker
        process.exit(0);
    });
    var express = require('express')
        , routes = require('./routes')
        , user = require('./routes/user')
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

    http.createServer(app).listen(app.get('port'), function(){
        console.log("Express server listening on port " + app.get('port'));
        console.log(process.env.NODE_ENV);
    });
}