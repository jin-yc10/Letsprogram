/**
 * Created with JetBrains WebStorm.
 * User: Jin-yc10
 * Date: 13-5-9
 * Time: 上午10:41
 * To change this template use File | Settings | File Templates.
 */

function initRemoteCompile(socket, $){
    socket.on('compileResult',function(content){
        var result = JSON.parse(content);
        console.log(result);
        if (project_id == result.projectID){
            var textToShow = '';
            textToShow += '<strong>' + 'Compile' + '</Strong> <br />' ;
            textToShow += result.compile.stderr;
            textToShow += '<br /><strong>' + 'Exec' + '</Strong> <br />' ;
            textToShow += result.exec.stdout;
//            $.pnotify({
//                title: 'CompileResult',
//                text: textToShow,
//                opacity: .8,
//                type: 'Success'
//            })
            addCompileMessage($('#console-container'), textToShow);
        } }  );
    $('#compile').bind('click',execFile);
}

function execFile(){
    var compileInformation={};
    compileInformation.Filename=treeSelectItem.path;
    compileInformation.projectID=project_id;
    compileInformation.userName=user_name;
    socket.emit('compile',JSON.stringify(compileInformation));
}

function addCompileMessage(parent, message) {
    var container = $('#console-container');
    var newNode = '<div style = \' color: white;\'>' + message + '</div>';
    container.append(newNode);
}