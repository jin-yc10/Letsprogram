/**
 * Created with JetBrains WebStorm.
 * User: Jin-yc10
 * Date: 13-4-4
 * Time: 下午8:08
 * To change this template use File | Settings | File Templates.
 */

<!-- 初始化 -->

var serverURL = 'http://101.5.145.90:3001' //'http://localhost:3001';//'http://59.66.138.69:3001';//;
var editor;
var ace_session;
var currentACESession;
var socket;
var projSocket;
var mouseX, mouseY;
var triggerPosition = {};
triggerPosition.x = 0;
triggerPosition.y = 0;
var treeSelectItem = {};
var dataString;
var files;
var userInformation = {};
var currentModifyDocumentInfo = {};
var selection;
var modifyArray = [];
userInformation.username = user_name;
userInformation.projectID = project_id;
function getOffset(object,attr)
{
    var offset = 0;
    while (object)
    {
        offset += object[attr];
        object = object.offsetParent;
    }
    return offset;
}
jQuery.noConflict();
jQuery(document).ready( function($) {
    userInformation.username = user_name;
    userInformation.projectID = project_id;
    socket = io.connect(serverURL);
    initWebRTC();
    initFileTree($);
    initRemoteCompile(socket, $);
    setupFileUploader(socket, $);
    initCommunication(socket, $);

    $("#chatMessage").keyup(function(e){
        if(e.keyCode == 13)
        {
            var chatInformation={};
            chatInformation.projectID=project_id;
            chatInformation.userName=user_name;
            chatInformation.content=$("#chatMessage").val().toString();
            $("#chatMessage").val("");
            socket.emit('clientMessage',JSON.stringify(chatInformation));
            return false;
        }
        else if(e.keyCode == 27){
            showToolBox();
        }
        return false;
    });

    //alert(chatInformation.content);

    $('#cursor-follower').hover(function(e){
        $('#cursor-follower').css('background', 'blue');
    }, function(e){
        $('#cursor-follower').css('background', 'red');
    });

    <!-- trigger mouse move, and get the mouse position -->
    $(document).on('mousemove',function(e){
        mouseX = e.pageX;
        mouseY = e.pageY;
    });
    socket.on('server-connection', function(e){
        $.pnotify({
            title: 'Connect!',
            text: '已连接到服务器！',
            opacity: .8,
            type: 'info'
        });
        socket.emit('client-connectEnsure', JSON.stringify(userInformation));
    });

    $('#save').bind('click',saveFile);

    socket.on('serverMessage',function(content){
        var chatInformation = JSON.parse(content);
        if (project_id == chatInformation.projectID){
            $.pnotify({
                title: 'ChatMessage',
                text: chatInformation.content,
                opacity: .8,
                type: 'Info'
            });
        }
    })

    socket.on('disconnect', function(e){
        $.pnotify({
            title: 'Disconnect!',
            text: '从主服务器断开！',
            opacity: .8,
            type: 'error'
        });
        projSocket = undefined;
    });

    editor = ace.edit("editor");
    editor.setTheme("ace/theme/chrome");
    editor.getSession().setMode("ace/mode/javascript");
    editor.on("change", function onChangeHandler(e){
        //onEditorChange(e);
        if(e.data){
            //alert(e.data.text);
        }
    });
    editor.commands.addCommand({
        name: 'saveFile',
        bindKey: {
            win: 'Ctrl-S',
            mac: 'Command-S',
            sender: 'editor|cli'
        },
        exec: saveFile
    });
    editor.commands.addCommand({
        name: 'run',
        bindKey: {
            win: 'Ctrl-r',
            mac: 'Command-r',
            sender: 'editor|cli'
        },
        exec: execFile
    });
    editor.commands.addCommand({
        name: 'showToolBox',
        bindKey: {
            win: 'Alt-t',
            mac: 'Command-t',
            sender: 'editor|cli'
        },
        exec: showToolBox
    });
    ace_session = editor.getSession();
    initCursorEvents();

    socket.on('project_respond', function (data){
        var respond = JSON.parse(data);
        switch(respond.type){
            case 'error':
                $.pnotify({
                    title: 'Notice',
                    text: respond.message,
                    opacity: .8,
                    type: 'error'
                });
                break;
            case 'deny':
                $(function(){
                    $.pnotify({
                        title: 'Notice',
                        text: respond.message,
                        opacity: .8,
                        type: 'error'
                    });
                });
                break;
            case 'success':
                $(function(){
                    $.pnotify({
                        title: 'Notice',
                        text: respond.message,
                        type: 'success',
                        opacity: .8
                    });
                });
                break;
            case 'openfile':
                //console.log(respond.data);
                currentModifyDocumentInfo.data = respond.data;
                currentModifyDocumentInfo.lines = {};
                currentACESession = ace.createEditSession(currentModifyDocumentInfo.data);
                currentACESession.setMode("ace/mode/javascript");
                editor.setSession(currentACESession);
                initCursorEvents();
                selection = currentACESession.getSelection();
                selection.on("changeCursor", function(){
                    currentModifyDocumentInfo.selection = selection.getCursor();
                    onCursorChange(selection.getCursor());
                });
                selection.on("changeSelection", function(){
                    onSelectionChange(selection.getRange());
                });
                currentACESession.on('change', function onChange(e){
                    onCurrentDocumentChange(e);
                });
                editor.getSession().setMode(getFileModeString(currentModifyDocumentInfo.fileName));
                var padOperation = {};
                padOperation.type = 'open';
                padOperation.userName = user_name;
                padOperation.targetFileName = currentModifyDocumentInfo.fileName;
                padOperation.targetFilePath = currentModifyDocumentInfo.filePath;
                padOperation.fileContent = respond.data;
                projSocket.emit('project_pad_operation', JSON.stringify(padOperation));
                break;
            case 'deletedirectory':
                $.pnotify({
                    title: 'delete success',
                    text: respond.message,
                    type: 'success',
                    opacity: .8
                });
                $('#file-tree').fileTree({
                    root: './userFile/' + project_id,
                    script: '/p/listfile/' + project_id,
                    expandSpeed: 1000,
                    collapseSpeed: 1000,
                    multiFolder: false
                }, function(file) {
                    request_Openfile(file);
                });
                break;
            case 'saveEditedFile':
                $.pnotify({
                    title: 'Save file',
                    text: respond.message,
                    type: 'success',
                    opacity: .8
                });
                break;
            default:
                $.pnotify({
                    title: 'Unhandled server message',
                    text: respond.message,
                    type: 'success',
                    opacity: .8
                });
                break;
        }
    });

    socket.on('project_client_message', function(message){
        var respond = JSON.parse(message);
        $.pnotify({
            title: 'project_client_message',
            text: message,
            opacity: .8,
            type: 'Info'
        });
    });
    socket.on('specific_channel', function(message){
        $.pnotify({
            title: 'specific_channel',
            text: message,
            opacity: .8,
            type: 'Info'
        });
        if(projSocket === undefined){
            projSocket = io.connect(serverURL + '/p/'+userInformation.projectID);
            projSocketInit(projSocket, $);
        }
    })
});

<!-- 事件响应 -->
var versionNumber = 0;
function projSocketInit(socket, $){
    socket.on('proj_server_connect', function(message){
        $.pnotify({
            title: '项目服务器信息',
            text: '项目服务器已连接',
            opacity: .8,
            type: 'Info'
        });
        socket.emit('project_personal_information', JSON.stringify(userInformation));
    });
    socket.on('proj_server_message', function(message){
        var x = JSON.parse(message);
        $.pnotify({
            title: '项目服务器信息',
            text: '\<div\>' + x.message + '\</div\>',
            opacity: .8,
            type: 'Info'
        });
    });
    socket.on('proj_server_list_message', function(message){
        var x = JSON.parse(message);
        generateUserList(x.curentUserList);
    });
    socket.on('project_pad_operation', function(message){
        var operation = JSON.parse(message);
        switch(operation.type){
            case 'open':
                $.pnotify({
                    title: '文本动作信息',
                    text: operation.userName + '打开了' + operation.targetFileName + '文件',
                    opacity: .8,
                    type: 'Info'
                });
                break;
            case 'modify':
                modifyArray.push(operation.payLoad.e);
                currentACESession.getDocument().applyDeltas([operation.payLoad.e.data]);
                versionNumber = operation.versionNumber;
                //console.log("New Version Number : " + versionNumber);
                //TODO apply proper modify
                break;
            case 'cursorPos_change':
                handleOtherCursorChange(operation, $);
                break;
            case 'markerRange_change':
                myhandleIncomingMarkerMessage(operation);
                break;
        }
    });
    socket.on('project_pad_modify_confirm', function(message){
        versionNumber = message;
        //console.log("New Version Number : " + versionNumber);
    });
}

function saveFile(){
    var projectRequest = {};
    projectRequest.projectID = project_id;
    projectRequest.userName = user_name;
    projectRequest.request = 'saveEditedFile';
    projectRequest.fileName = currentModifyDocumentInfo.filePath;
    projectRequest.content = editor.getSession().getDocument().getValue();
    socket.emit('project_request', JSON.stringify(projectRequest));
}

function parseDucumentData(fulltext){
    fulltext.split('\r\n');
}

function onCursorChange(e){
    var padOperation = {};
    padOperation.type = 'cursorPos_change';
    padOperation.userName = user_name;
    padOperation.targetFileName = currentModifyDocumentInfo.fileName;
    padOperation.targetFilePath = currentModifyDocumentInfo.filePath;
    padOperation.payLoad = e;
    projSocket.emit('project_pad_operation', JSON.stringify(padOperation));
    var screenPos = editor.getSession().documentToScreenPosition(e.row, e.column);
    var session = editor.getSession();
    var editor_document = editor.getSession().getDocument();
    var renderer = editor.renderer;
    var p = renderer.textToScreenCoordinates(e.row, e.column);
}
var markerID = -1;
function onSelectionChange(range){
    //console.log(range);
    var padOperation = {};
    padOperation.type = 'markerRange_change';
    padOperation.userName = user_name;
    padOperation.targetFileName = currentModifyDocumentInfo.fileName;
    padOperation.targetFilePath = currentModifyDocumentInfo.filePath;
    padOperation.payLoad = range;
    projSocket.emit('project_pad_operation', JSON.stringify(padOperation));
}

function onCurrentDocumentChange(e){
    //console.log(e);
    var tempArray = [];
    var flag = false;
    for(var x in modifyArray){
        if(checkSameChange(e, modifyArray[x]) && (!flag)){
            flag = true;
            continue;
        }
        tempArray.push(x);
    }
    if(flag){
        console.log('digest reflection');
        return;
    }
    var lines = e.target.$lines;
    var totalLine = e.target.getValue();
    var padOperation = {};
    padOperation.type = 'modify';
    padOperation.userName = user_name;
    padOperation.projName = project_id;
    padOperation.targetFileName = currentModifyDocumentInfo.fileName;
    padOperation.targetFilePath = currentModifyDocumentInfo.filePath;
    padOperation.payLoad = {};
    padOperation.payLoad.lines = lines;
    padOperation.payLoad.totalLine = totalLine;
    padOperation.payLoad.e = e;
    padOperation.versionNumber = versionNumber;
    projSocket.emit('project_pad_operation', JSON.stringify(padOperation));
    currentModifyDocumentInfo.data = padOperation.payLoad;
}

function calcTextCoordToScreenCoord(row, col){
    var renderer = editor.renderer;
    var padding = renderer.$padding;
    var charWidth = renderer.characterWidth;
    var lineHeight = renderer.lineHeight;
    var firstRow = editor.getFirstVisibleRow();

    var x = renderer.$padding + Math.round(col * charWidth);
    var y = (row-firstRow) * lineHeight;

    return {
        pageX: x,
        pageY: y
    };
}

function checkSameChange(c1, c2){
    if(c1.data != undefined && c2.data != undefined){
        if(c1.data.action === c2.data.action){
            if(c1.data.text === c2.data.text){
                if( c1.data.range.start.row === c2.data.range.start.row &&
                    c1.data.range.start.column === c2.data.range.start.column &&
                    c1.data.range.end.row === c2.data.range.end.row &&
                    c1.data.range.end.column === c2.data.range.end.column
                ){
                    return true;
                }
            }
            else if(c1.data.lines === c2.data.lines){
                if(c1.data.range.start === c2.data.range.start &&
                    c1.data.range.end === c2.data.range.end ){
                    return true;
                }
            }
        }
    }
    return false;
}

function getFileModeString(fileName){
    var postfix = fileName.substring(fileName.indexOf('.')+1);
    switch(postfix){
        case 'c':
        case 'cpp':
            return 'ace/mode/c_cpp';
        case 'java':
            return 'ace/mode/java';
        case 'js':
            return 'ace/mode/javascript';
        case 'tex':
            return 'ace/mode/latex';
        default:
            return 'ace/mode/asciidoc';
    }
}
var isToolBoxDisplay = false;
function showToolBox(){
    if(isToolBoxDisplay == false){
        var pageHeight = $(document).height();
        var pageWidth = $(document).width();
        var myHeight = $('#toolBox').height();
        var myWidth = $('#toolBox').width();
        var pos = {};
        pos.top = pageHeight / 2 - myHeight / 2;
        pos.left = pageWidth / 2 - myWidth / 2;
        $('#toolBox').css('top', pos.top);
        $('#toolBox').css('left', pos.left);
        $('#toolBox').css('display', 'block' );
        $('#chatMessage').focus();
        isToolBoxDisplay = true;
    }
    else{
        $('#toolBox').css('display', 'none' );
        isToolBoxDisplay = false;
    }
}
function generateUserList(list){
    $('#userlist-container div').remove();
    var container = $('#userlist-container');
    for(var i = 0; i < list.length; i++)
    {
        var newNode = '<div class = \'user-item\' style = \' color: black;\'>' + list[i] + '</div>';
        container.append(newNode);
    }
}