/**
 * Created with JetBrains WebStorm.
 * User: Jin-yc10
 * Date: 13-5-9
 * Time: 下午1:14
 * To change this template use File | Settings | File Templates.
 */

exports.UserModel = UserModel;

function UserModel(username, socket, project){
    this.username = undefined;
    this.currentOpenFile = undefined;
    this.project = project;
    this.socket = socket;
    console.log(this.username + " project server connection");
    this.socket = socket;
    this.initSocket(socket, this);
}

UserModel.prototype.initSocket = function initSocket(socket, user){
    socket.emit('proj_server_connect', '');
    socket.on('test_message', function(message){
        console.log('test_message');
    });

    socket.on('project_personal_information', function(message){
        var userInformation = JSON.parse(message);
        socket.broadcast.emit('proj_server_message', userInformation.username + '来了');
        socket.set('username', userInformation.username);
        socket.set('projectid', userInformation.projectID);
        user.username = userInformation.username;
        user.project.broadCastUserList();
    });

    socket.on('project_pad_operation', function(message){
        var padOperation = JSON.parse(message);
        switch(padOperation.type){
            case 'open':
                socket.broadcast.emit('project_pad_operation', message);
                user.project.openFile(padOperation.targetFilePath);
                user.currentOpenFile = padOperation.targetFilePath;
                break;
            case 'modify':
                var newVersion = user.project.incomingModifyMessage(user, padOperation);
                user.socket.emit('project_pad_modify_confirm', newVersion);
                break;
            case 'cursorPos_change':
                var openers = user.project.findUsersByFile(padOperation.targetFilePath);
                for(var i = 0; i < openers.length; i++){
                    if(openers[i].getName() !== user.username){
                        openers[i].sendMessage('project_pad_operation', message);
                    }
                }
            case 'markerRange_change':
                var openers = user.project.findUsersByFile(padOperation.targetFilePath);
                for(var i = 0; i < openers.length; i++){
                    if(openers[i].getName() !== user.username){
                        openers[i].sendMessage('project_pad_operation', message);
                    }
                }
                break;
        }
    });

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
        socket.broadcast.emit('proj_server_message', user.getName() + '下线了');
        user.removeSelf(socket);
    });
}

UserModel.prototype.removeSelf = function(socket){
    this.project.removeUser(this.username, socket);
}

UserModel.prototype.getName = function(){
    return this.username;
}

UserModel.prototype.getOpenFileName = function(){
    return this.currentOpenFile;
}

UserModel.prototype.sendMessage = function(name, message){
    this.socket.emit(name, message);
}