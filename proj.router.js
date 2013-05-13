/**
 * Created with JetBrains WebStorm.
 * User: Jin-yc10
 * Date: 13-4-4
 * Time: 下午9:24
 * To change this template use File | Settings | File Templates.
 */
var httpd = require('http').createServer(handler);
var io = require('socket.io').listen(httpd, {log : false});
var fs = require('fs');
var Files = {};
var tempPath = '';
var p = require('path');
var util = require('util');
function handler(req, res) {
    fs.readFile(__dirname + '/index.html',
        function(err, data) {
            if (err) {
                res.writeHead(500);
                return res.end('Error loading index.html');
            }
            res.writeHead(200);
            res.end(data);
        }
    );
}

var users = {};
var projects = {};
/*
model
-documents {
    document{
        openers{}
        changesets{
            changeset{
                version number;
                changeType
                related line/lines
                change content
            }
        }
    }
}
-usercount
-clientsSockets {}
-serverSocket
 */
var projectModel = {};
exports.setRouter = function (app) {
    httpd.listen(4000);
    io.sockets.on('connection', function (socket) {
        console.log("socket connection");
        socket.emit('server-connection', '');
        socket.on('clientMessage', function(content) {
            socket.emit('serverMessage', 'You said: ' + content);
            socket.broadcast.emit('serverMessage', socket.id + ' said: ' +
                content);
        });

        socket.on('clientMessage', function(content) {
            socket.emit('serverMessage', 'You said: ' + content);
            socket.broadcast.emit('serverMessage', socket.id + ' said: ' +
                content);
        });

        socket.on('client-connectEnsure', function(content) {
            console.log(content);
            var userInformation = JSON.parse(content);
            console.log(userInformation);
            if( projectModel[userInformation.projectID] === undefined){
                projectModel[userInformation.projectID] = {};
                projectModel[userInformation.projectID].documents = {};
                projectModel[userInformation.projectID].userCount = 1;
                projectModel[userInformation.projectID].clients = {};
                projectModel[userInformation.projectID].serverSocket =
                    io.of('/p/' + userInformation.projectID).on('connection', function(socket){
                        projServerSetup(socket, userInformation.projectID);
                    });
            }
            projectModel[userInformation.projectID].userCount++;
            socket.emit('specific_channel', '\/p\/' + userInformation.projectID + ' is enable');
            socket.set('username',userInformation.username);
            socket.set('projectid', userInformation.projectID);
        });

        socket.on('pad_textChange', function(e) {
            //console.info(e);
            var d = JSON.parse(e);
            //Text_Merger.incomingMessage(d);
            //Text_Merger.doMerge();
            socket.emit('server_PadChange', JSON.stringify(d));
        });

        socket.on('pad_requestMerge', function(e) {
            //console.info(e);
            var e = Text_Merger.doMerge();
            socket.emit('server_respondMerge', JSON.stringify(e));
        });

        socket.on('project_request', function(content){
            var projectRespond = {};
            projectRespond.type = '';
            var projectRequest = JSON.parse(content);
            var projectID =  projectRequest.projectID;
            var projectPath = tempPath + projectID;
            //var projectName = projectRequest.projectName;
            //var userID = projectRequest.userID;
            var userName = projectRequest.userName;
            console.log(projectRequest);
            if(checkPermission(projectID, userName)){
                console.log('Server execute :' + projectRequest.request);
                //console.log(projectRequest);
                switch (projectRequest.request){
                    case 'newfile':
                        //fs.open(projectPath + '\\' + projectRequest.fileName);
                        console.log("create file : " + projectRequest.fileName);
                        if(fs.existsSync(projectRequest.fileName)){
                            projectRequest.parentFolder;
                            projectRespond.type = 'error';
                            projectRespond.message = '添加文件 '+ projectRequest.fileName + ' 失败, 该文件已存在';
                            projectRespond.fileName = projectRequest.fileName;
                            projectRespond.fileContent = "";
                            socket.emit('project_respond', JSON.stringify(projectRespond));
                        }
                        else{
                            var handler;
                            fs.writeFile(projectRequest.fileName, "", function(err, fd) {
                                handler = fd;
                                if(err) {
                                    projectRequest.parentFolder;
                                    projectRespond.type = 'error';
                                    projectRespond.message = '添加文件 '+ projectRequest.fileName + ' 失败，原因是：'
                                        + JSON.stringify(err);
                                    projectRespond.fileName = projectRequest.fileName;
                                    projectRespond.fileContent = "";
                                    socket.emit('project_respond', JSON.stringify(projectRespond));
                                    console.log(err);
                                } else {
                                    projectRequest.parentFolder;
                                    projectRespond.type = 'success';
                                    projectRespond.message = '添加文件 '+ projectRequest.fileName + ' 成功';
                                    projectRespond.fileName = projectRequest.fileName;
                                    projectRespond.fileContent = "";
                                    socket.emit('project_respond', JSON.stringify(projectRespond));
                                    console.log("The file was saved!");
                                }
                            });
                        }
                        break;
                    case 'delete_file':
                        fs.unlink(projectRequest.fileName, function(err){
                            projectRespond.fileName = projectRequest.fileName;
                            projectRespond.fileContent = "";
                            projectRespond.type = 'success';
                            projectRespond.message = '删除文件 '+ projectRequest.fileName + ' 成功';
                            socket.emit('project_respond', JSON.stringify(projectRespond));
                        });
                        break;
                    case 'add_folder':
                        break;
                    case 'deletedirectory':
                        rmTreeSync( projectRequest.fileName );
                        projectRespond.fileName = projectRequest.fileName;
                        projectRespond.fileContent = "";
                        projectRespond.type = 'deletedirectory';
                        projectRespond.message = '删除文件夹 '+ projectRequest.fileName + ' 成功';
                        socket.emit('project_respond', JSON.stringify(projectRespond));
                        console.log(projectRespond);
                        break;
                    case 'openfile':
                        <!-- 读取文件并返回-->
                        projectRespond.fileName = projectRequest.fileName;
                        projectRespond.fileContent = "";
                        projectRespond.type = 'openfile';
                        projectRespond.message = '打开文件 '+ projectRequest.fileName + ' 成功';
                        var mydata;
                        mydata = fs.readFile(projectRequest.fileName, 'utf8', function (err,data) {
                            if (err) {
                                return console.log(err);
                            }
                            mydata = data;
                            console.log(data);
                            projectRespond.data = data;
                            //projectModel[projectID].documents[projectRequest.fileName].data = data;
                            socket.emit('project_respond', JSON.stringify(projectRespond));
                        });
                        //console.log(mydata);
                        projectRespond.data = mydata;
                        break;
                    case 'saveEditedFile':
                        projectRespond.fileName = projectRequest.fileName;
                        projectRespond.fileContent = "";
                        projectRespond.type = 'saveEditedFile';
                        projectRespond.message = '保存文件 '+ projectRequest.fileName + ' 成功';
                        var mydata;
                        fs.writeFile(projectRequest.fileName,projectRequest.content,function(e){//会先清空原先的内容
                            if(e) throw e;
                            socket.emit('project_respond', JSON.stringify(projectRespond));
                        });
                        break;
                };
            }
            else{
                projectRespond.type = 'deny';
                projectRespond.message = 'please check your authority or contant the project owner';
                socket.emit('project_respond', JSON.stringify(projectRespond));
            }
        });

        socket.on('Start', function (data) { //data contains the variables that we passed through in the html file
            var Name = data['Name'];
            Files[Name] = {  //Create a new Entry in The Files Variable
                FileSize : data['Size'],
                Data	 : "",
                Downloaded : 0
            }
            var Place = 0;
            try{
                var Stat = fs.statSync(tempPath +  Name);
                if(Stat.isFile())
                {
                    Files[Name]['Downloaded'] = Stat.size;
                    Place = Stat.size / 524288;
                }
            }
            catch(er){} //It's a New File
            fs.open(tempPath + Name, 'a', 0755, function(err, fd){
                if(err)
                {
                    console.log(err);
                }
                else
                {
                    Files[Name]['Handler'] = fd; //We store the file handler so we can write to it later
                    socket.emit('MoreData', { 'Place' : Place, Percent : 0 });
                }
            });
        });

        socket.on('Upload', function (data){
            var Name = data['Name'];
            Files[Name]['Downloaded'] += data['Data'].length;
            Files[Name]['Data'] += data['Data'];
            if(Files[Name]['Downloaded'] == Files[Name]['FileSize']) //If File is Fully Uploaded
            {
                fs.write(Files[Name]['Handler'], Files[Name]['Data'], null, 'Binary', function(err, Writen){
                    socket.emit('Done', Name);
                });
                console.log("upload done");
                fs.close(Files[Name]['Handler'], function(err){});
            }
            else if(Files[Name]['Data'].length > 10485760){ //If the Data Buffer reaches 10MB
                fs.write(Files[Name]['Handler'], Files[Name]['Data'], null, 'Binary', function(err, Writen){
                    Files[Name]['Data'] = ""; //Reset The Buffer
                    var Place = Files[Name]['Downloaded'] / 524288;
                    var Percent = (Files[Name]['Downloaded'] / Files[Name]['FileSize']) * 100;
                    socket.emit('MoreData', { 'Place' : Place, 'Percent' :  Percent});
                });
            }
            else
            {
                var Place = Files[Name]['Downloaded'] / 524288;
                var Percent = (Files[Name]['Downloaded'] / Files[Name]['FileSize']) * 100;
                socket.emit('MoreData', { 'Place' : Place, 'Percent' :  Percent});
            }
        });

        socket.on('disconnect', function(){
            //console.log(socket);
            console.log('disconnect');
            var my;
        });

        socket.on('clientMessage', function(content) {
            var chatInformation= JSON.parse(content);
            console.log('chat');
            //socket.emit('serverMessage', 'You said: ' + content);

            //io.of('/p/'+chatInformation.projectID).emit('serverMessage', content);
            socket.broadcast.emit('serverMessage', content);
        });

        socket.on('compile',function(content){
            console.log('here');

            var compileInformation = JSON.parse(content);
            var fileName = compileInformation.Filename;
            var length = fileName.length;
            var start = fileName.lastIndexOf('.');
            var type = fileName.substring(start,length);
            var trueName = fileName.substring(0,start);
            var path = fileName.substring(0,fileName.lastIndexOf('/')-1);

            var gccCMD;
            var tempResult;
            var args;
            var compileResult={};
            console.log(fileName);

            var process = require('child_process');
            var exec = process.exec,
                spawn = process.spawn,
                child;
            // /////////////////////////////

            if(type=='.c')
            {
                gccCMD = 'gcc';
                args = ['-o',compileInformation.projectID+'.exe',fileName ] ;
                //gccCMD = 'gcc '+fileName+' -o'+compileInformation.projectID+'.exe';
               // tempResult =  compileInformation.projectID;
              //  var compileResult={};
                child = spawn(gccCMD,args);
                  child.stdout.on('data',function(data){
                      console.log('stdout: '+ data);
                    //  compileResult.compile.stdout = data;
                  });
                   child.stderr.on('data',function(data){
                       console.log('stderr: '+ data);
                    //   compileResult.compile.stderr = data;
                   });
                   child.on('error',function(err){
                       console.log('error: '+err);
                    //   compileResult.compile.error = err;

                   });
                   child.on('exit', function(code){

                   });
                compileResult.compile = {};
                gccCMD =  compileInformation.projectID;
                args = [];
              //  child = spawn(gccCMD,args);
                socket.emit('askInput',(compileInformation));
                child = spawn(gccCMD,args);
                var input;
               // socket.emit('askInput',null);
                socket.on('inputMessage',function(content){
                        input = JSON.parse(content);
                    if(input.projectID==compileInformation.projectID){
                        if(!input.content) {
                            child.stdin.resume();
                            this.child.stdin.resume();
                            if(!this.child.stdin.write(input.content+'\n', function(){
                                return callback(null);
                            }));
                    }
                    }
                });

                 compileResult.exec = {};
                child.stdout.on('data',function(data){
                   // data = data.toString();
                    if(data!='')
                    compileResult.exec.stdout =data;

                    console.log('stdout11: '+ data);
                    //compileResult.exec.stdout =data.toString();
                });
                child.stderr.on('data',function(data){
                    console.log('stderr: '+ data);
                   compileResult.exec.stderr = data;
                });
                child.on('error',function(err){
                    console.log('error: '+err);
                   compileResult.exec.error = err;

                });
                compileResult.projectID=compileInformation.projectID;
                compileResult.userName=compileInformation.userName;
              socket.emit('compileResult',JSON.stringify(compileResult));
              //  socket.emit('compileResult',compileResult);


            }
            if(type=='.cpp')
            {
                gccCMD = 'g++ '+fileName+' -o'+compileInformation.projectID+'.exe';
                tempResult =  compileInformation.projectID;
                var compileResult={};
                child = exec(gccCMD,
                    function (error, stdout, stderr) {
                        compileResult.compile = {};
                        if(stdout!==''){
                            console.log('---------stdout: ---------\n' + stdout);
                            compileResult.compile.stdout = stdout;
                        }
                        if(stderr!==''){
                            console.log('---------stderr: ---------\n' + stderr);
                            compileResult.compile.stderr = stderr;
                        }
                        if (error !== null) {
                            console.log('---------exec error: ---------\n' + error);
                            compileResult.compile.error = error;
                        }

                    });

                child = exec(tempResult,
                    function (error, stdout, stderr) {

                        //  var compileResult;
                        compileResult.exec = {};
                        if(stdout!==''){
                            compileResult.exec.stdout = stdout;
                            console.log('---------stdout: ---------\n' + stdout);
                        }
                        if(stderr!==''){
                            compileResult.exec.stderr = stderr;
                            console.log('---------stderr: ---------\n' + stderr);
                        }
                        if (error !== null) {
                            compileResult.type = 'error';
                            compileResult.exec.error = error;
                            console.log('---------exec error: ---------\n[' + error+']');
                        }
                        compileResult.projectID=compileInformation.projectID;
                        compileResult.userName=compileInformation.userName;
                        socket.emit('execResult',JSON.stringify(compileResult));
                    });

            }

            else if(type=='.java')
            {

                gccCMD = 'javac '+ fileName;

                console.log('path: '+path);
                child = exec('cd '+path,{});

              //  tempResult = 'java '+trueName;
                var compileResult={};
                child = exec(gccCMD,
                    function (error, stdout, stderr) {
                     //   var compileResult={};
                        compileResult.compile = {};
                        if(stdout!==''){
                            console.log('---------stdout: ---------\n' + stdout);
                            compileResult.compile.stdout = stdout;
                        }
                        if(stderr!==''){
                            console.log('---------stderr: ---------\n' + stderr);
                            compileResult.compile.stderr = stderr;
                        }
                        if (error !== null) {
                            console.log('---------exec error: ---------\n' + error);
                            compileResult.compile.error = error;
                        }
                    });

                      //  compileResult.projectID=compileInformation.projectID;
                      //  compileResult.userName=compileInformation.userName;
                var tempName = trueName.substring(trueName.lastIndexOf('/')+1,trueName.length);
                console.log('tempName: '+ tempName);
                tempResult = 'java '+tempName;
                        child = exec(tempResult,
                            function (error, stdout, stderr) {
                              //  var compileResult;
                                compileResult.exec = {};
                                if(stdout!==''){
                                    compileResult.exec.stdout = stdout;
                                    console.log('---------stdout: ---------\n' + stdout);
                                }
                                if(stderr!==''){
                                    compileResult.exec.stderr = stderr;
                                    console.log('---------stderr: ---------\n' + stderr);
                                }
                                if (error !== null) {
                                    compileResult.type = 'error';
                                    compileResult.exec.error = error;
                                    console.log('---------exec error: ---------\n[' + error+']');
                                    socket.emit('compileResult',JSON.stringify(compileResult));
                                }

                            });


                    }
            else if(type=='.js')
            {
                gccCMD = 'node '+fileName;
                child = exec(gccCMD,
                    function (error, stdout, stderr) {
                        var compileResult={};
                        compileResult.compile = {};
                        if(stdout!==''){
                            console.log('---------stdout: ---------\n' + stdout);
                            compileResult.compile.stdout = stdout;
                        }
                        if(stderr!==''){
                            console.log('---------stderr: ---------\n' + stderr);
                            compileResult.compile.stderr = stderr;
                        }
                        if (error !== null) {
                            console.log('---------exec error: ---------\n' + error);
                            compileResult.compile.error = error;
                        }
                        compileResult.projectID=compileInformation.projectID;
                        compileResult.userName=compileInformation.userName;
                        socket.emit('compileResult',JSON.stringify(compileResult));
                    });

            }
            else if(type=='.py')
            {
                gccCMD = 'python '+fileName;
                var compileResult={};
                    compileResult.compile = {};
                child = exec(gccCMD,
                    function (error, stdout, stderr) {
                      //  var compileResult={};
                        compileResult.exec = {};
                        if(stdout!==''){
                            console.log('---------stdout: ---------\n' + stdout);
                            compileResult.exec.stdout = stdout;
                        }
                        if(stderr!==''){
                            console.log('---------stderr: ---------\n' + stderr);
                            compileResult.exec.stderr = stderr;
                        }
                        if (error !== null) {
                            console.log('---------exec error: ---------\n' + error);
                            compileResult.exec.error = error;
                        }
                        compileResult.projectID=compileInformation.projectID;
                        compileResult.userName=compileInformation.userName;
                        socket.emit('compileResult',JSON.stringify(compileResult));
                    });
            }

        });
    });


    // 处理：返回文件列表请求
    app.post('/p/listfile/:projid', function (req, res) {
        var projID = req.params.projid;
        // 此处应当对id进行判断并进行进一步的处理
        console.log(projID);
        var fs = require('fs'),
            _path = require('path'),
            fileList = [];
        var treeHtml = '';
        var localPath = req.body.dir;
        console.info("walk " + localPath);
        function walk(path){
            treeHtml = treeHtml + "\<ul class=\"jqueryFileTree\" style=\"display: none;\"\>\n";
            var dirList = fs.readdirSync(localPath);
            dirList.forEach(function(item){
                if(fs.statSync(localPath + '/' + item).isDirectory()){
                    treeHtml = treeHtml + "\<li class=\"directory collapsed\"\>\<a href=\"#\" rel=\"" +path + '/' + item + '/' +"\"\>"+item + "\</a></li>\n";
                }
            });
            dirList.forEach(function(item){
                if(!fs.statSync(localPath + '/' + item).isDirectory()){
                    var extname = _path.extname(item);
                    extname = extname.substr(1);
                    treeHtml = treeHtml + "\<li class=\"file ext_"+extname+"\"\>\<a href=\"#\" rel=\"" +path + '/' + item+"\"\>"+item + "\</a></li>\n";
                }
            });
            treeHtml = treeHtml + "\</ul>";
        }

        walk(req.body.dir, function(err){
            console.error(err);
            res.send("");
        });
        //console.info("send " + treeHtml);
        res.send(treeHtml);
    });
}

function checkPermission(projectID, userID){
    return true;
}

var rmTreeSync = exports.rmTreeSync = function(path) {
    console.log("deleting path: "+ path);
    //如果文件路径不存在或文件路径不是文件夹则直接返回
    if (!p.existsSync(path) || !fs.statSync(path).isDirectory()) return;
    var files = fs.readdirSync(path);
    //如果文件夹为空则直接删除
    if (!files.length) {
        fs.rmdirSync(path);
        return;
    } else {
        //文件夹不为空，依次删除文件夹下的文件
        files.forEach(function(file) {
            var fullName = p.join(path, file);
            if (fs.statSync(fullName).isDirectory()) {
                rmTreeSync(fullName);
            } else {
                fs.unlinkSync(fullName);
            }
        });
    }
    //最后删除根文件夹
    fs.rmdirSync(path);
    console.log("删除文件夹: ", path , "完毕");
};

function projServerSetup(socket, projID) {
    socket.emit('proj_server_connect', '');
    socket.on('test_message', function(message){
        console.log('test_message');
    });

    socket.on('project_personal_information', function(message){
        var userInformation = JSON.parse(message);
        projectModel[userInformation.projectID].clients[userInformation.username] = {};
        projectModel[userInformation.projectID].clients[userInformation.username].socket = socket;
        console.log('client '+ userInformation.username +' at channel: '+userInformation.projectID+' connected' );
        socket.broadcast.emit('proj_server_message', userInformation.username + '来了');
        socket.set('username', userInformation.username);
        socket.set('projectid', userInformation.projectID);
    });

    /*
        处理文档操作:
        1 打开
        2 修改
        2.1 增加一个新行
        2.2 删除原有的一行
    */
    socket.on('project_pad_operation', function(message){
        console.log(message);
        var padOperation = JSON.parse(message);
        switch(padOperation.type){
            case 'open':
                socket.broadcast.emit('project_pad_operation', message);
                socket.get('projectid',function(err, proj){
                    if(projectModel[proj].documents[padOperation.targetFilePath] === undefined){
                        projectModel[proj].documents[padOperation.targetFilePath] = {};
                        projectModel[proj].documents[padOperation.targetFilePath].totalLine = {};
                        projectModel[proj].documents[padOperation.targetFilePath].openers = {};
                        projectModel[proj].documents[padOperation.targetFilePath].changesets = {};
                    }
                    projectModel[proj].documents[padOperation.targetFilePath].openers[padOperation.userName] = padOperation.userName;
                    projectModel[proj].documents[padOperation.targetFilePath].fileContent = padOperation.fileContent;
                    for(var key in projectModel[proj].documents[padOperation.targetFilePath].openers){
                        console.log(padOperation.targetFilePath + ' opended by ' + key);
                    }
                });
                break;
            case 'modify':
                sendMessageToOpeners(message, padOperation.targetFilePath, socket);
                break;
            case 'cursorPos_change':
                sendMessageToOpeners(message, padOperation.targetFilePath, socket);
                break;
        }
    });

    /*
    处理项目目录树操作:
    1 增加文件
    2 删除文件
    3 增加一个文件夹
    4 删除一个文件夹
    */
    socket.on('project_tree_operation', function(message){
        console.log(message);
        var treeOperation = JSON.parse(message);
        switch(treeOperation.type){
            case 'addFile':
                break;
            case 'deleteFile':
                break;
            case 'addDirectory':
                break;
            case 'deleteDirectory':
                break;
            default:
                break;
        }
    });

    socket.on('disconnect', function(){
        //console.log(socket);
        var info = {};
        socket.get('username', function(err, name){
            info.name = name;
            socket.get('projectid', function(err, proj){
                info.proj = proj;
                socket.broadcast.emit('proj_server_message', info.name + '下线了');
            });
        });
    })

    function sendMessageToOpeners(message, fileName, socket){
        socket.get('projectid',function(err, proj){
            if(projectModel[proj].documents[fileName] === undefined){
                projectModel[proj].documents[fileName] = {};
                projectModel[proj].documents[fileName].openers = {};
                projectModel[proj].documents[fileName].changesets = {};
            }
            else if(projectModel[proj].documents[fileName].openers === undefined){
                projectModel[proj].documents[fileName].openers = {};
            }
            for(var key in projectModel[proj].documents[fileName].openers){
                if(socket !== projectModel[proj].clients[key].socket){
                    projectModel[proj].clients[key].socket.emit('project_pad_operation', message);
                }
            }
        });
    }
}