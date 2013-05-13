/**
 * Created with JetBrains WebStorm.
 * User: Jin-yc10
 * Date: 13-5-10
 * Time: 上午10:01
 * To change this template use File | Settings | File Templates.
 */

var cursor_users = {};

function initCursorEvents(){
    var session = editor.getSession();
    session.on("changeScrollTop", function(scrollTop){
        recalcAllCursors();
    });
    session.on("changeScrollLeft", function(scrollTop){
        recalcAllCursors();
    });
}

function handleOtherCursorChange(operation, $){
    //console.log(operation);
    var userName = operation.userName;
    if(cursor_users[userName] === undefined){
        cursor_users[userName] = {};
        var container = $('#container');
        var newFollower = "<div class = 'cursor-follower' id = " + userName + "'></div>";
        var newOutofSightIndicator = "<div class = 'cursor-outOfSightIndicator' id = " + userName + "'></div>";
        container.append(newFollower);
        container.append(newOutofSightIndicator);
    }
    var row = operation.payLoad.row;
    var column = operation.payLoad.column;
    var renderer = editor.renderer;
    var p = renderer.textToScreenCoordinates(row, column);
    cursor_users[userName].row = row;
    cursor_users[userName].column = column;
    recalcAllCursors();
}

function recalcAllCursors(){
    var renderer = editor.renderer;
    for(var obj in cursor_users){
        var user = cursor_users[obj];
        var row = user.row;
        var column = user.column;
        var p = renderer.textToScreenCoordinates(row, column);
        var heightInVision = $('#editor-container').height();
        var heightBase = $('#editor-container').offset().top;
        if(p.pageY < 0 + heightBase || p.pageY + 10> heightInVision + heightBase ){
            console.log('cursor out of sight');
            $('.cursor-follower,#' + obj).css('display', 'none' );
            if(p.pageY < 0 + heightBase){
                $('.cursor-outOfSightIndicator,#' + obj).removeClass("down");
                $('.cursor-outOfSightIndicator,#' + obj).addClass("up");
                $('.cursor-outOfSightIndicator,#' + obj).offset({ top: heightBase - 20, left: p.pageX});
            }
            else{
                $('.cursor-outOfSightIndicator,#' + obj).removeClass("up");
                $('.cursor-outOfSightIndicator,#' + obj).addClass("down");
                $('.cursor-outOfSightIndicator,#' + obj).offset({ top: heightInVision + heightBase, left: p.pageX});
            }
            $('.cursor-outOfSightIndicator,#' + obj).css('display', 'block' );
        }
        else{
            $('.cursor-outOfSightIndicator,#' + obj).css('display', 'none' );
            $('.cursor-follower,#' + obj).css('height', renderer.lineHeight );
            $('.cursor-follower,#' + obj).css('display', 'block' );
            $('.cursor-follower,#' + obj).offset({ top: p.pageY, left: p.pageX});
        }
    }
}