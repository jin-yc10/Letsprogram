/**
 * Created with JetBrains WebStorm.
 * User: Jin-yc10
 * Date: 13-5-9
 * Time: 上午10:41
 * To change this template use File | Settings | File Templates.
 */
var stack_bottomright = {"dir1": "up", "dir2": "left", "firstpos1": 25, "firstpos2": 25};
function initFileTree($){
    var x = $('#file-tree');
    x.fileTree({
        root: './userFile/' + project_id,
        script: '/p/listfile/' + project_id,
        expandSpeed: 1000,
        collapseSpeed: 1000,
        multiFolder: false
    }, function(file) {
        request_Openfile(file);
        treeSelectItem.path = file;
    });
    $('#tree-container-wrapper').contextmenu();
    $('#tree-container-wrapper').contextmenu().on('open-context', function(e){
        triggerPosition.x = mouseX;
        triggerPosition.y = mouseY;
        console.log("Trigger: " + triggerPosition.x + ' ' +triggerPosition.y);
        var top = triggerPosition.y;
        var left = triggerPosition.x;
        var lastTriggerItem;
        $('.jqueryFileTree li').each(function(index,element){
            var x = element;
            var left = getOffset(x,'offsetLeft');
            var mtop = getOffset(x,'offsetTop');
            if(mtop < top && mtop + element.offsetHeight > top){
                lastTriggerItem = element;
            }
        });
        var classString = lastTriggerItem.classList[0];
        if(classString == 'directory'){
            // directory
            console.log("Dire:" + lastTriggerItem.children[0].attributes[1].nodeValue);
            treeSelectItem.type = 'directory';
            treeSelectItem.name = lastTriggerItem.children[0].textContent;
            treeSelectItem.path = lastTriggerItem.children[0].attributes[1].nodeValue;
            treeSelectItem.directory = treeSelectItem.path;
            $('.folder-disable').addClass('disabled-link');
            $('.file-disable').removeClass('disabled-link');
        }
        else{
            // file
            console.log("File:" + lastTriggerItem.children[0].attributes[1].nodeValue);
            treeSelectItem.type = 'file';
            treeSelectItem.name = lastTriggerItem.children[0].textContent;
            treeSelectItem.path = lastTriggerItem.children[0].attributes[1].nodeValue;
            var lastSlash = treeSelectItem.path.lastIndexOf('/');
            treeSelectItem.directory = treeSelectItem.path.substring(0, lastSlash+1);
            console.log("File direc:" +  treeSelectItem.directory);
            $('.folder-disable').removeClass('disabled-link');
            $('.file-disable').addClass('disabled-link');
        }
        treeSelectItem.path = lastTriggerItem.children[0].attributes[1].nodeValue;
    });
    $('.context-operator').bind('click', function(e){
        var triggerElement = event.target  ||  event.srcElement; // 获得事件源
        var triggerText = triggerElement.textContent;
        switch(triggerText){
            case 'Add new file':
                $( "#dialog-form-newFile" ).dialog('open');
                break;
            case 'Add new directory':
                $( "#dialog-form-newDirectory" ).dialog('open');
                break;
            case 'Import files':
                $( "#dialog-form-importFile" ).dialog('open');
                break;
            case 'Delete file':
                delete_file(treeSelectItem.path);
                var tree = $('#file-tree').fileTree({
                    root: './userFile/' + project_id,
                    script: '/p/listfile/' + project_id,
                    expandSpeed: 1000,
                    collapseSpeed: 1000,
                    multiFolder: false
                }, function(file) {
                    request_Openfile(file);
                });
                console.log(JSON.stringify(tree));
                break;
            case 'Delete directory':
                delete_Directory(treeSelectItem.path);
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
        }
        //alert(triggerText);
    });
    $('.context-file-operator').bind('click', function(e){
        var triggerElement = event.target  ||  event.srcElement; // 获得事件源
        var triggerText = triggerElement.textContent;
        //alert(triggerText);
        switch(triggerText){
            case 'Open':
                var path = treeSelectItem.path;
                if(treeSelectItem.type === 'file'){
                    request_Openfile(treeSelectItem.path);
                }
                else{

                }
                break;
            case 'Cut':
                $.pnotify({
                    title: 'Cut',
                    text: '文件' + treeSelectItem.name + '已经放入剪贴板',
                    opacity: .8,
                    type: 'info'
                });
                break;
            case 'Copy':
                break;
            case 'Paste':
                break;
        }
    });
    $( "#dialog-form-newFile" ).dialog({
        autoOpen: false,
        height: 300,
        width: 350,
        modal: true,
        buttons: {
            "Confirm": function() {
                var projectRequest = {};
                projectRequest.projectID = project_id;
                projectRequest.userName = user_name;
                projectRequest.request = 'addNewFile';
                projectRequest.fileName = $('#newFileName').val();
                $('#newFileName').val('');
                var newFilePath = treeSelectItem.directory + projectRequest.fileName;
                request_NewFile(newFilePath);
                $('#file-tree').fileTree({
                    root: './userFile/' + project_id,
                    script: '/p/listfile/' + project_id,
                    expandSpeed: 1000,
                    collapseSpeed: 1000,
                    multiFolder: false
                }, function(file) {
                    request_Openfile(file);
                });
                $( this ).dialog( "close" );
            },
            Cancel: function() {
                $( this ).dialog( "close" );
            }
        },
        close: function() {
        }
    });
	$( "#dialog-form-newDirectory" ).dialog({
        autoOpen: false,
        height: 300,
        width: 350,
        modal: true,
        buttons: {
            "Confirm": function() {
                var projectRequest = {};
                projectRequest.projectID = project_id;
                projectRequest.userName = user_name;
                projectRequest.request = 'addNewFile';
                projectRequest.fileName = $('#newFileDirName').val();
                $('#newFileDirName').val('');
                var newFilePath = treeSelectItem.directory + projectRequest.fileName;
                request_NewDir(newFilePath);
                $('#file-tree').fileTree({
                    root: './userFile/' + project_id,
                    script: '/p/listfile/' + project_id,
                    expandSpeed: 1000,
                    collapseSpeed: 1000,
                    multiFolder: false
                }, function(file) {
                    request_Openfile(file);
                });
                $( this ).dialog( "close" );
            },
            Cancel: function() {
                $( this ).dialog( "close" );
            }
        },
        close: function() {
        }
    });
    $( "#dialog-form-importFile" ).dialog({
        autoOpen: false,
        height: 500,
        width: 500,
        modal: true,
        buttons: {
            "Confirm": function() {
                var x = $('#FileBox')[0];
                for(var l = 0; l < x.files.length; l++){
                    SelectedFiles.push(x.files[l]);
                }
                StartUpload();
                $( this ).dialog( "close" );
            },
            Cancel: function() {
                $( this ).dialog( "close" );
            }
        },
        close: function() {
        }
    });
    $('.data-title').attr('data-menutitle', "Some JS Title");
    $(".disabled-link").click(function(event) {
        event.preventDefault();
    });
}

var SelectedFiles = [];
var SelectedFile;
var FReader;
var Name;
var loader;
var progress;
var j;
function UpdateBar($, percent){
    if(progress){
        progress.progressbar('option', 'value', percent);
    }
}
function StartUpload(){
    // create a progress bar
    SelectedFile = SelectedFiles[SelectedFiles.length-1];
    Name = treeSelectItem.directory + SelectedFile.name;
    // Make a loader.
    if(loader === undefined){
        loader = j.pnotify({
            title: "上传"+SelectedFile.name,
            text: "<div class=\"progress_bar\" />",
            icon: 'picon picon-throbber',
            hide: false,
            closer: false,
            sticker: false,
            history: false,
            addclass: "stack-bottomright",
            stack: stack_bottomright,
            before_open: function(pnotify) {
                progress = pnotify.find("div.progress_bar");
                progress.progressbar({
                    value: 0
                });
                // Pretend to do something.
            }
        });
    }
    else{
        progress.progressbar('option', 'value', 0);
        loader.pnotify({title: "上传"+SelectedFile.name});
    }
    if(document.getElementById('FileBox').value != "")
    {
        FReader = new FileReader();
        FReader.onload = function(evnt){
            socket.emit('Upload', { 'Name' : Name, Data : evnt.target.result });
        }
        socket.emit('Start', { 'Name' : Name, 'Size' : SelectedFile.size });
    }
    else
    {
        alert("Please Select A File");
    }
}

function setupFileUploader(socket, $){
    j = $;
    if(window.File && window.FileReader){ //These are the necessary HTML5 objects the we are going to use
        document.getElementById('UploadButton').addEventListener('click', StartUpload);
        //document.getElementById('FileBox').addEventListener('change', FileChosen);
    }
    else {
        document.getElementById('UploadArea').innerHTML = "Your Browser Doesn't Support The File API Please Update Your Browser";
    }
    socket.on('MoreData', function (data){
        UpdateBar(data['Percent']);
        var Place = data['Place'] * 524288; //The Next Blocks Starting Position
        var NewFile; //The Variable that will hold the new Block of Data
        if(SelectedFile.webkitSlice)
            NewFile = SelectedFile.webkitSlice(Place, Place + Math.min(524288, (SelectedFile.size-Place)));
        else if(SelectedFile.mozSlice)
            NewFile = SelectedFile.mozSlice(Place, Place + Math.min(524288, (SelectedFile.size-Place)));
        else if(SelectedFile.slice)
            NewFile = SelectedFile.slice(Place, Place + Math.min(524288, (SelectedFile.size-Place)));
        FReader.readAsBinaryString(NewFile);
    });
    socket.on('Done', function (data){
        var Content = "File Successfully Uploaded !!";
        //if(loader.pnotify_remove){loader.pnotify_remove();}
        SelectedFiles.pop();
        if(SelectedFiles.length > 0){
            $.pnotify({
                title: 'Info!',
                text: '上传文件'+data+'成功，还有' + SelectedFiles.length + '个文件',
                opacity: .8,
                type: 'Info'
            });
            StartUpload();
        }
        else{
            if(loader.pnotify_remove){loader.pnotify_remove();}
            $.pnotify({
                title: 'Info!',
                text: '上传文件完毕',
                opacity: .8,
                type: 'success'
            });
            loader = undefined;
            $('#file-tree').fileTree({
                root: './userFile/' + project_id,
                script: '/p/listfile/' + project_id,
                expandSpeed: 1000,
                collapseSpeed: 1000,
                multiFolder: false
            }, function(file) {
                request_Openfile(file);
            });
        }
    });
}

<!-- 请求打开文件 -->
function request_Openfile(filePath){
    var projectRequest = {};
    projectRequest.projectID = project_id;
    projectRequest.userName = user_name;
    projectRequest.request = 'openfile';
    projectRequest.fileName = filePath;
    var lastSlash = filePath.lastIndexOf('/');
    var fileName = filePath.substring(lastSlash+1);
    socket.emit('project_request', JSON.stringify(projectRequest));
    var openFileMessage = {
        fileName: fileName,
        filePath: filePath,
        userName: user_name
    }
    currentModifyDocumentInfo.fileName = fileName;
    currentModifyDocumentInfo.filePath = filePath;
}

function request_NewFile(filePath){
    var projectRequest = {};
    projectRequest.projectID = project_id;
    projectRequest.userName = user_name;
    projectRequest.request = 'newfile';
    projectRequest.fileName = filePath;
    socket.emit('project_request', JSON.stringify(projectRequest));
}

function request_NewDir(filePath){
    var projectRequest = {};
    projectRequest.projectID = project_id;
    projectRequest.userName = user_name;
    projectRequest.request = 'add_folder';
    projectRequest.fileName = filePath;
    socket.emit('project_request', JSON.stringify(projectRequest));
}

function delete_Directory(filePath){
    var projectRequest = {};
    projectRequest.projectID = project_id;
    projectRequest.userName = user_name;
    projectRequest.request = 'deletedirectory';
    projectRequest.fileName = filePath;
    socket.emit('project_request', JSON.stringify(projectRequest));
}

function delete_file(filePath){
    var projectRequest = {};
    projectRequest.projectID = project_id;
    projectRequest.userName = user_name;
    projectRequest.request = 'delete_file';
    projectRequest.fileName = filePath;
    socket.emit('project_request', JSON.stringify(projectRequest));
}
