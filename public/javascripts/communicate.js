/**
 * Created with JetBrains WebStorm.
 * User: Jin-yc10
 * Date: 13-4-21
 * Time: 上午10:31
 * To change this template use File | Settings | File Templates.
 */

/*
    this file is for voice and video communications
    also support text chatting
*/
var wsServerURL = 'ws://101.5.145.90:3002'; //'ws://localhost:3002/';//'ws://59.66.138.69:3002/'; //
function initWebRTC(){
    var roomName = userInformation.projectID;
    if(PeerConnection) {
        rtc.createStream({
            "video": {"mandatory": {}, "optional": []},
            "audio": true
        }, function(stream) {
            document.getElementById('you').src = URL.createObjectURL(stream);
            document.getElementById('you').play();
            //videos.push(document.getElementById('you'));
            //rtc.attachStream(stream, 'you');
            //subdivideVideos();
        });
    } else {
        alert('Your browser is not supported or you have to turn on flags. In chrome you go to chrome://flags and turn on Enable PeerConnection remember to restart chrome');
    }


    var room = roomName;
    var wsURL = wsServerURL;

    rtc.connect(wsURL, room);

    rtc.on('add remote stream', function(stream, socketId) {
        console.log("ADDING REMOTE STREAM..." + socketId);
        var container = $('#chat-container');
        var newVideo = '<video id = ' + socketId + ' autoplay="true" style="width: 100%"></video>';
        container.append(newVideo);
        rtc.attachStream(stream, socketId);
    });
    rtc.on('disconnect stream', function(data) {
        console.log('remove ' + data);
        removeVideo(data);
    });
}
function removeVideo(socketId) {
    var video = document.getElementById(socketId);
    if(video) {
        video.parentNode.removeChild(video);
    }
}
function initCommunication(socket, $){
    $('#send').bind('click',function(){
        //alert('hello');
        var chatInformation={};
        chatInformation.projectID=project_id;
        chatInformation.userName=user_name;
        chatInformation.content=$("#chatMessage").val().toString();
        //alert(chatInformation.content);
        socket.emit('clientMessage',JSON.stringify(chatInformation));
    });
}