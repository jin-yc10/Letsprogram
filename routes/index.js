var crypto = require('crypto');
var User = require('../models/user.js');
var Proj = require('../models/proj.js');
var querystring = require("querystring"),
    fs = require("fs"),
    formidable = require("formidable");
var nodemailer = require("nodemailer");
var Apply =require('../models/apply.js');
var Invite = require('../models/invite.js');
var projectRouter = require('./proj.router.js');

module.exports = function (app) {
    app.get('/',checkForReminder);
    app.get('/', function (req, res, next) {
        //req.pagenum=1;
        //next();

        res.render('index', {
            title: "Start up",
            pagenum: '1'});
        //res.redirect('/');
    });
    app.get("/reg", function (req, res) {
        //req.pagenum=2;
        res.render('reg', {
            title: "Sign up Now",
            pagenum: '2'});
    });
    app.get("/login", function (req, res) {
        //res.session.pagenum=3;
        res.render('login', {
            title: "Sign in",
            pagenum: '3'});
    });
    app.get("/newproj", function (req, res) {
        //res.session.pagenum=3;
        res.render('newproj', {
            title: "New Project",
            pagenum: '4'});
    });
    app.get("/test1", function (req, res) {
        res.render('test1', { title: "Test1" });
    });
    app.get("/test2", function (req, res) {
        res.render('test2', { title: "Test1" });
    });
    app.get("/file-upload",function(req,res){
        res.render('file-upload',{ title:" File-upload",
            pagenum:'4'});
    });
    app.get("/modification",function(req,res){
        res.render('modification',{ title:"Modify password",
            pagenum:'4'});
    });
    app.get("/verification",function(req,res){
        res.render('verification', {
            title: "Verify identificaiton",
            pagenum: '3'});
    });
    app.post('/reg', checkNotLogin);
    app.post('/reg', function (req, res) {
        //检验用户两次输入的口令是否一致
        if (req.body['password'].length<6) {
            req.flash('error', 'Password is too short (minimum is 6 characters)');
            return  res.redirect('/reg');
        }

        if (req.body['password-repeat'] != req.body['password']) {
            req.flash('error', 'Password doesn\'t match the confirmation');
            return  res.redirect('/reg');
        }
        //生成口令的散列值
        var  md5 = crypto.createHash('md5');
        var  password = md5.update(req.body.password).digest('base64');
        var  path = "C:\\Users\\HUXIAO\\Desktop\\test\\test\\public\\images\\default.png";
        var newPath = "C:\\Users\\HUXIAO\\Desktop\\test\\test\\public\\images\\" + req.body.username+".png";

        fs.readFile(path, function (err, data) {
            fs.writeFile(newPath, data, function (err) {
                 });
        });

        var  newUser =  new  User({
            name: req.body.username,
            password: password,
            avatar:newPath
        });

        //检查用户名是否已经存在
        User.get(newUser.name, function (err, user) {
            if (user)
                err = 'Username is already taken.';
            if (err) {
                req.flash('error', err);
                return res.redirect('/reg');
            }
            // 如果不存在则新增用户
            newUser.save(function (err) {
                if (err) {
                    req.flash('error', err);
                    return  res.redirect('/reg');
                }
                req.session.user = newUser;
                req.flash('success', 'Signed up successfully.');
                res.redirect('/');
            });
        });
    });
    app.post('/login', checkNotLogin);
    app.post('/login', function(req, res) {
        var md5 = crypto.createHash('md5');
        var password = md5.update(req.body.password).digest('base64');
        User.get(req.body.username, function(err, user) {
            if (!user) {
                req.flash('error', 'User \''+req.body.username+'\' does not exist.');
                return res.redirect('/login');
            }
            if (user.password != password) {
                req.flash('error', 'Incorrect username or password.');
                return res.redirect('/login');
            }
            req.session.user = user;
            req.flash('success', 'Signed in successfully.');
            res.redirect('/');
        });
    });
    app.get('/logout', checkLogin);
    app.get('/logout', function(req, res) {
        req.session.user = null;
        req.flash('success', 'Signed out successfully');
        res.redirect('/');
    });

    app.post('/newproj',checkLogin);
    app.post('/newproj', function (req, res) {
        if (req.body['projname'].length==0) {
            req.flash('error', 'The new project need a name.');
            return  res.redirect('/newproj');
        }
        if (req.body['projname'].length>20) {
            req.flash('error', 'That name is too long to be cool.');
            return  res.redirect('/newproj');
        }
        var  newProj =  new Proj({
            name: req.body.projname,
            lang: req.body.selectLang,
            admin: req.session.user.name
        },new Date());

        Proj.getByName(newProj.name, function (err, proj) {
            if (proj.length!=0)
                err = 'Project with this name already exist.' +
                    'Try a different name.';
            if (err) {
                req.flash('error', err);
                return res.redirect('/newproj');
            }
            newProj.save(function (err) {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('/newproj');
                }
                var path="userFile/"+newProj.name
                fs.mkdirSync(path, 0755);
                fs.open(path+"/Welcome.txt","w",0644,function(e,fd){

                    if(e) throw e;

                    fs.write(fd,"Let's Program Now!",0,'utf8',function(e){

                        if(e) throw e;

                        fs.closeSync(fd);

                    })

                });

                req.flash('success', 'Project successfully created.');
                return  res.redirect('/p/'+newProj.id);
            });
        });
    });
    app.get('/u/:user', function (req, res) {
        User.get(req.params.user,  function (err, user) {
            if (!user) {
                req.flash('error', 'This user doesn\'t not exist.');
                return  res.redirect('/');
            }
            Proj.getByUser(user.name, function (err, projs) {
                if (err) {
                    req.flash('error', err);
                    return  res.redirect('/');
                }
                var pagenum=1;
                var query=req.query;
                var pageTotal=Math.ceil(projs.length/8);
                if (query.page)
                {
                    pagenum=query.page;
                }

                projs=projs.slice(8*(pagenum-1),8*pagenum);
                res.render('personal', {
                    title: user.name+'\'projects',
                    user: user,
                    pagenum: -1,
                    projs: projs,
                    projPageNum:pagenum,
                    pageTotal:pageTotal,
                    url:req.url
                });
            });
        });
    });
    app.get('/newproj',checkLogin);
    app.get('/p/:proj',checkLogin);
    app.get('/p/:proj', function (req, res) {
        Proj.get(req.params.proj, function (err, proj) {
            if (!proj) {
                req.flash('Project \''+req.params.proj+'\' doesn\'t exist.', err);
                return res.redirect('/');
            }
            var i;
            for(i=0;i<proj.member.length;i++){
                if (proj.member[i]==req.session.user.name)
                {
                    Apply.getByProj(req.params.proj, function(err,applys){
                        var applyFlag=false;
                        if (applys.length>0)
                            applyFlag=true;
                        var isAdmin=false;
                        if (req.session.user.name==proj.admin)
                            isAdmin=true;
                        res.render('projIndex', {
                            title: req.session.user.name+' at '+proj.name,
                            user: req.session.user,
                            applys: applyFlag,
                            pagenum: -1,
                            proj: proj,
                            isAdmin:isAdmin
                        });
                    });
                    return;
                }
            }

            res.render('projInfo', {
                title: 'Take a look at '+proj.name,
                pagenum: -1,
                proj: proj
            });
        });
    });
    app.get('/search', function(req,res){
        var query=req.query;
        if (query.proj==1)
        {
            Proj.getByName(query.s, function (err, projs) {
                if (err) {
                    req.flash('error', err);
                    return  res.redirect('/');
                }
                var pagenum=1;
                var pageTotal=Math.ceil(projs.length/8);
                if (query.page)
                {
                    pagenum=query.page;
                }

                projs=projs.slice(8*(pagenum-1),8*pagenum);
                res.render('search', {
                    title: "Discover on Let's Program",
                    projs: projs,
                    pagenum: -1,
                    projPageNum:pagenum,
                    pageTotal: pageTotal,
                    url:req.url
                });
            });
            return;
        }
        else if (query.user==1)
        {

        }
        res.render('search', {
            title: "Discover on Let's Program",
            projs: null,
            pagenum: -1,
            prefix:req.url
        });
    });
    app.post('/p/:proj', function(req,res){
        res.redirect('/p/apply/'+req.params.proj);
    });
    app.get('/p/apply/:proj',checkLogin);
    app.get('/p/apply/:proj',function (req,res){
        Proj.get(req.params.proj, function (err, proj) {
            if (!proj) {
                req.flash('Project \''+req.params.proj+'\' doesn\'t exist.', err);
                return res.redirect('/');
            }
            res.render('apply',{
                title: 'Apply for '+proj.name,
                proj: proj,
                pagenum: -1
            });
        });
    });
    app.post('/p/apply/:proj',function (req,res){
        var applyID=req.params.proj+req.session.user.name;
        Apply.getById(applyID, function (err, apply) {
            if (apply)
            {

                req.flash('error', 'Your previous apply for this project has already ' +
                    'reached the team. Perhaps they ' +
                    'need more time to think about it.');
                return res.redirect('/p/apply/'+req.params.proj);
            }
            if (err) {

                req.flash('error', err);
                return res.redirect('/p/apply/'+req.params.proj);
            }
            var  newApply =  new  Apply({
                projID: req.params.proj,
                user: req.session.user.name,
                time: new Date(),
                message: req.body.message
            });
            newApply.save(function (err) {
                if (err) {
                    req.flash('error', err);
                    return  res.redirect('/p/apply/'+req.params.proj);
                }
                req.flash('success', 'Your apply has already ' +
                'reached the team. Good luck!');
                res.redirect('/p/'+req.params.proj);
            });
        });
    });
    app.get('/p/application/:proj',function(req,res){
        var query=req.query;
        var confirmnum=query.confirm;
        var ignorenum=query.ignore;
        Proj.get(req.params.proj, function (err, proj) {
            if (!proj) {
                req.flash('error','Project \''+req.params.proj+'\' doesn\'t exist.');
                return res.redirect('/');
            }
            if (proj.admin!=req.session.user.name)
            {
                err='Only the leader can do this.';
                req.flash('error',err);
                res.redirect('/p/'+req.params.proj);
                return;
            }
            Apply.getByProj(req.params.proj, function(err,applys){
                if(confirmnum!=null){
                    Proj.addMember(req.params.proj,applys[confirmnum].user,
                        function(err){
                            if(err){
                                req.flash('error', 'Sorry, something wrong with the' +
                                    ' database...');
                            }
                            Apply.delete(applys[confirmnum].id,function(err){
                                    if(err){
                                        req.flash('error', 'Sorry, something wrong' +
                                            ' with the database...');
                                    }
                                    return res.redirect('/p/application/'+req.params.proj);
                            });
                    });
                    return;
                }
                if(ignorenum!=null){
                    Apply.delete(applys[ignorenum].id,function(err){
                            if(err){
                                req.flash('error', 'Sorry, something wrong with database...');
                            }
                            return res.redirect('/p/application/'+req.params.proj);
                    });
                    return;
                }
                var pagenum=1;
                var pageTotal=Math.ceil(applys.length/8);
                if (query.page)
                    pagenum=query.page;

                applys=applys.slice(8*(pagenum-1),8*pagenum);

                res.render('application', {
                    title: 'Applications for '+proj.name,
                    applys: applys,
                    pagenum: -1,
                    proj: proj,
                    isAdmin: true,
                    applyPageNum:pagenum,
                    pageTotal:pageTotal,
                    url:req.url
                });
            });
        });
    });
    app.post('/application',function(req,res){
        res.redirect('/p/application/'+req.params.proj);
    });
    app.get('/p/kickout/:proj',function (req, res) {
        Proj.get(req.params.proj, function (err, proj) {
            if (!proj) {
                req.flash('error','Project \''+req.params.proj+'\' doesn\'t exist.');
                return res.redirect('/');
            }
            if (proj.admin!=req.session.user.name)
            {
                err='Only the leader can do this.';
                req.flash('error',err);
                res.redirect('/p/'+req.params.proj);
                return;
            }
            var i;
            for(i=0;i<proj.member.length;i++)
            {
                if(proj.member[i]==req.session.user.name)
                    break;
            }
            proj.member[i]=proj.member[proj.member.length-1];
            proj.member.length--;
            var query=req.query;
            var kicknum=query.kick;
            if(kicknum!=null){
                Proj.deleteMember(req.params.proj,proj.member[kicknum],
                    function(err){
                        if(err){
                            req.flash('error', 'Sorry, something wrong with the' +
                                ' database...');
                        }
                        return res.redirect('/p/kickout/'+req.params.proj);
                    });
                return;
            }
            var pagenum=1;

            if (query.page)
                pagenum=query.page;


            Apply.getByProj(req.params.proj, function(err,applys){
                var applyFlag=false;
                if (applys.length>0)
                    applyFlag=true;
                res.render('kickout', {
                    title: 'Eliminate members of '+proj.name,
                    applys: applyFlag,
                    pagenum: -1,
                    proj: proj,
                    isAdmin:true,
                    userPageNum:pagenum,
                    url:req.url
                });
            });
        });
    });
    app.get('/p/editor/:proj',checkLogin);
    app.get('/p/editor/:proj', function (req, res) {
        Proj.get(req.params.proj, function (err, proj) {
            if (!proj) {
                req.flash('Project \''+req.params.proj+'\' doesn\'t exist.', err);
                return res.redirect('/');
            }
            res.render('editor', {
                title: req.session.user.name+' at '+proj.name,
                user: req.session.user,
                pagenum: -1,
                proj: proj.name
            });
        });
    });
    app.get('/p/invite/:proj', function(req,res){
        Proj.get(req.params.proj, function (err, proj) {
            if (!proj) {
                req.flash('error','Project \''+req.params.proj+'\' doesn\'t exist.');
                return res.redirect('/');
            }
            if (proj.admin!=req.session.user.name)
            {
                err='Only the leader can do this.';
                req.flash('error',err);
                res.redirect('/p/'+req.params.proj);
                return;
            }
            var query=req.query;
            if (query.invite)
            {
                User.get(query.invite, function (err, user) {
                    if (err) {
                        req.flash('error', err);
                        return  res.redirect('/p/invite/'+req.params.proj);
                    }
                    for (var i=0;i<proj.member.length;i++)
                        if (proj.member[i]==user.name)
                        {
                            req.flash('error', user.name+' is already in '+Proj.name+'.');
                            return  res.redirect('/p/invite/'+req.params.proj);
                        }
                    Proj.addMember(proj.id,user.name,function(err){
                        if (err){
                            req.flash('error', err);
                            return  res.redirect('/p/invite/'+req.params.proj);
                        }
                        req.flash('success', user.name+' was added to '+proj.name+".");
                        return  res.redirect('/p/'+req.params.proj);
                    });
                });
                return;
            }
            if (query.user==1)
            {
                User.get(query.s, function (err, user) {
                    if (err) {
                        req.flash('error', err);
                        return  res.redirect('/p/invite/'+req.params.proj);
                    }
                    var users=new Array();
                    if(user){
                        if (query.s=="")
                            users=user;
                        else
                            users.push(user);
                    }
                    else{
                        users.length=0;
                    }
                    var pagenum=1;
                    var pageTotal=Math.ceil(users.length/8);
                    if (query.page)
                        pagenum=query.page;

                    users=users.slice(8*(pagenum-1),8*pagenum);
                    Apply.getByProj(req.params.proj, function(err,applys){
                        var applyFlag=false;
                        if (applys.length>0)
                            applyFlag=true;
                        res.render('projinvite', {
                            title: 'Ask People to Join '+proj.name,
                            applys: applyFlag,
                            pagenum: -1,
                            proj: proj,
                            isAdmin:true,
                            users:users,
                            s:query.s,
                            userPageNum:pagenum,
                            pageTotal:pageTotal,
                            url:req.url
                        });
                    });
                });
                return;
            }
            Apply.getByProj(req.params.proj, function(err,applys){
                var applyFlag=false;
                if (applys.length>0)
                    applyFlag=true;
                res.render('projinvite', {
                    title: 'Ask People to Join '+proj.name,
                    applys: applyFlag,
                    pagenum: -1,
                    proj: proj,
                    isAdmin:true,
                    users:null,
                    s:""
                });
            });
        });
    });
    /*
    app.get('/p/invitein/:proj',function(req,res){
        Proj.get(req.params.proj, function (err, proj) {
            if (!proj) {
                req.flash('error','Project \''+req.params.proj+'\' doesn\'t exist.');
                return res.redirect('/');
            }
            res.render('invite',{
                title: 'Ask '+req.user+' to join '+proj.name,
                proj: proj,
                user: req.query.user,
                pagenum: -1
            });
        });
    });
    app.post('/p/invitein/:proj',function(req,res){
        req.flash('success', 'Your invite has already ' +
            'reached. Good luck!');
        res.redirect('/p/invite/'+req.params.proj);
    });*/

    app.post('/file-upload',function(req,res){
        fs.readFile(req.files.displayImage.path, function (err, data) {
            var newPath = "C:\\Users\\HUXIAO\\Desktop\\test\\test\\public\\images\\" + req.session.user.name+".png";
            fs.writeFile(newPath, data, function (err) {
            });
        });
        res.redirect('/');
    });
    app.post('/modification',function(req,res){
        if (req.body['password'].length<6) {
            req.flash('error', 'Password is too short (minimum is 6 characters)');
            return  res.redirect('/modification');
        }

        if (req.body['password-repeat'] != req.body['password']) {
            req.flash('error', 'Password doesn\'t match the confirmation');
            return  res.redirect('/modification');
        }
        //生成口令的散列值
        var  md5 = crypto.createHash('md5');
        var  password = md5.update(req.body.password).digest('base64');
        User.modify(req.session.user.name, password, function(err, user){
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            req.flash('success', 'Modify password successfully.');
            res.redirect('/');
        });
     });

    app.get('/u/temp/:user',function(req,res){
        User.get(req.params.user, function(err, user) {
            if (!user) {

                req.flash('error', 'User \''+req.params.user+'\' does not exist.');
                return res.redirect('/login');
            }
            req.session.user = user;

            res.redirect('/modification');
       });
    });

    app.post('/verification',function(req,res){
        var smtpTransport = nodemailer.createTransport("SMTP",{
            service:"Gmail",
            auth:{
                user:"xiaohupan10@gmail.com",
                pass:"weiminghuboyata"
            }
        });
        //var transport = nodemailer.createTransport("Sendmail");

        var mailOptions = {
            from: "xiaohupan10@gmail.com",
            to: "xiaohupan10@gmail.com",
            generateTextFromHTML: true,
            html:'<a><a>http://192.168.1.102:3000/u/temp/'+req.body['username']+'</a></a>'

        };
        smtpTransport.sendMail(mailOptions);
        req.flash('success', 'Send mail successfully.');
        res.redirect('/');
    })

    projectRouter.setRouter(app);
};
function checkLogin(req, res, next) {
    if (!req.session.user) {
        req.flash('error', 'You need to sign in for this.');
        return res.redirect('/login');
    }
    next();
}
function checkNotLogin(req, res, next) {
    if (req.session.user) {
        req.flash('error', 'You have already signed in as \''+
            req.session.user.name+'\'.');
        return res.redirect('/');
    }
    next();
}
function checkForReminder(req, res, next){
    req.session.reminders=null;
    if (req.session.user)
    {
        req.session.reminders=[];
        Invite.getByUser(req.session.user,function (err,invites){
            invites.forEach(function(invite,index){
                req.session.reminders.push(invites);
            })
        });
    }
    next();
}