/**
 * Created with JetBrains WebStorm.
 * User: Jin-yc10
 * Date: 13-5-9
 * Time: 下午1:17
 * To change this template use File | Settings | File Templates.
 */
var userModelPack = require('./usermodel');
var fileModelPack = require('./Filemodel');
exports.ProjectModel = ProjectModel;

function ProjectModel(projname, io){
    this.name = projname;
    this.users = [];
    var proj = this;
    this.files = {};
    io.of('/p/' + projname).on('connection', function(socket){
        var user = new userModelPack.UserModel(projname, socket, proj);
        proj.addUser(user);
    });
}

ProjectModel.prototype.openFile = function(fileName){
    if(this.files[fileName] === undefined){
        this.files[fileName] = new fileModelPack.FileModel(fileName);
    }
}

ProjectModel.prototype.addUser = function(user){
    this.users.push(user);
    this.broadCastUserList();
}

ProjectModel.prototype.removeUser = function(user){
    var deleteIndex = -1;
    var templist = [];
    for(var i = 0; i < this.users.length; i++){
        if(this.users[i].getName() === user){
            deleteIndex = i;
            continue;
        }
        else{
            templist.push(this.users[i])
        }
    }
    this.users.splice(deleteIndex, 1);
    this.users = templist;
    this.broadCastUserList();
    console.log('user ==> ' + user + 'leave');
    console.log('now ' + this.users.length + 'users');
}

ProjectModel.prototype.findUsersByFile = function(fileName){
    var usersArray = [];
    for(var i = 0; i < this.users.length; i++){
        if(this.users[i].getOpenFileName() !== undefined &&
            this.users[i].getOpenFileName() === fileName ){
            usersArray.push(this.users[i]);
        }
    }
    return usersArray;
}

// 用于处理用户端发送过来的修改事件
ProjectModel.prototype.incomingModifyMessage = function(user, object){
    var fileName = object.targetFilePath;
    var openers = this.findUsersByFile(fileName);
    var fileModel = this.files[fileName];
    var newVer = fileModel.IncomingDelta(object);
    for(var i = 0; i < openers.length; i++){
        if(openers[i].getName() !== user.getName()){
            var x = fileModel.calculateDelta(object, openers[i].getName(), this);
            openers[i].sendMessage('project_pad_operation', JSON.stringify(x));
            console.log('User:' + user.getName() + '\n'+ JSON.stringify(x));
        }
    }
    // BroadCast proper modification to other openers
    return newVer;
}

ProjectModel.prototype.getWhoIsOnlineEarlier = function(a, b, fileName){
    var openers = this.findUsersByFile(fileName);
    var aId, bId;
    for(var i = 0; i < openers.length; i++){
        if(openers[i].getName() !== a){
            aId = i;
        }
        else if(openers[i].getName() !== b){
            bId = i;
        }
    }
    return aId > bId;
}

ProjectModel.prototype.broadCastUserList = function(){
    var userlist = [];
    for(var i = 0; i < this.users.length; i++){
        userlist.push(this.users[i].getName());
        console.log(this.users[i].getName());
    }
    var listMessage = {};
    listMessage.curentUserList = userlist;
    for(var i = 0; i < this.users.length; i++){
        this.users[i].sendMessage('proj_server_list_message', JSON.stringify(listMessage));
    }
    return userlist;
}