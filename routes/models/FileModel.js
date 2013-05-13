/**
 * Created with JetBrains WebStorm.
 * User: Jin-yc10
 * Date: 13-5-9
 * Time: 下午7:53
 * To change this template use File | Settings | File Templates.
 */

exports.FileModel = FileModel;

function FileModel(filename){
    this.fileName = filename;
    this.modifies = [];
}

FileModel.prototype.getName = function(){
    return this.fileName;
}

FileModel.prototype.IncomingDelta = function(object){
    this.modifies.push(object);
    return this.modifies.length;
}

FileModel.prototype.calculateDelta = function(object, userName, project){
    var x = object;
    var incomingModifyUserName = object.userName;
    var ver = object.versionNumber;
    for(var i = 0; i < this.modifies.length; i++){
        var c = this.modifies[i];
        if(c.userName === userName && c.versionNumber > ver){
            var a = c.payLoad.e.data;
            var b = object.payLoad.e.data;
//            if(checkSameChange(a, b)){
//                // 遇到了完全一致的修改，放弃本次改动
//                return undefined;
//            }
            var cu = c.payLoad.e;
            var modifyx = object.payLoad.e;
            console.log(modifyx);
            console.log(cu);
            if(modifyx.data.range.end.row < cu.data.range.start.row){
                // 在修改点上方 不需要调整
                continue;
            }
            else if(modifyx.data.range.start.row === cu.data.range.start.row &&
                modifyx.data.range.end.column < cu.data.range.start.column){
                // 在修改点前面 不需要调整位置
                continue;
            }
            else if(modifyx.data.range.start.row === cu.data.range.start.row &&
                modifyx.data.range.start.column === cu.data.range.start.column){
                // 要进行一个隐形的判断
                if(project.getWhoIsOnlineEarlier(c.userName, object.userName, this.fileName)){
                    modifyx.data.range.start.column++;
                    modifyx.data.range.end.column++;
                }
                continue;
            }
            else if(cu.data.action == "insertText"){
                //首先判断是否插入换行符
                if(cu.data.text == "\n"){
                    modifyx.data.range.start.row++;
                    modifyx.data.range.end.row++;
                }
                else{
                    //如果不是插入换行符，那么判断是否在同一行
                    if(modifyx.data.range.start.row === cu.data.range.start.row){
                        //在同一行，就往后推
                        var delta = cu.data.range.end.column - cu.data.range.start.column;
                        modifyx.data.range.start.column += delta;
                        modifyx.data.range.end.column += delta;
                    }
                    else{
                        continue;
                    }
                }
            }
            else if(cu.data.action == "removeText"){
                //首先判断是否删除换行符
                if(cu.data.text == "\n"){
                    modifyx.data.range.start.row--;
                    modifyx.data.range.end.row--;
                }
                else{
                    //如果不是插入换行符，那么判断是否在同一行
                    if(modifyx.data.range.start.row === cu.data.range.start.row){
                        //在同一行，就往前推
                        var delta = cu.data.range.end.column - cu.data.range.start.column;
                        modifyx.data.range.start.column -= delta;
                        modifyx.data.range.end.column -= delta;
                    }
                    else{
                        continue;
                    }
                }
            }
            else if(cu.data.action == "insertLines"){
                //向下推
                var delta = cu.data.range.end.row - cu.data.range.start.row;
                modifyx.data.range.start.row += delta;
                modifyx.data.range.end.row += delta;
            }
            else if(cu.data.action == "removeLines"){
                //向上推
                var delta = cu.data.range.end.row - cu.data.range.start.row;
                modifyx.data.range.start.row -= delta;
                modifyx.data.range.end.row -= delta;
            }
        }
    }
    x.versionNumber = this.modifies.length + 1;
    return x;
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
                    // 暂时关闭判断重复功能
                    return false;
                }
            }
            else if(c1.data.lines === c2.data.lines){
                if(c1.data.range.start === c2.data.range.start &&
                    c1.data.range.end === c2.data.range.end ){
                    // 暂时关闭判断重复功能
                    return false;
                }
            }
        }
    }
    return false;
}

function calcDrift(modifyEventArray, x){
    var modifyx = modifyEventArray[x];
    if(true){
        for(var i = 0; i < x; i++){
            var cu = modifyEventArray[i];
            if(checkSameChange(modifyx, cu)){
                // 遇到了完全一致的修改，放弃本次改动
                return [];
            }
        }
        for(var i = 0; i < x; i++){
            var cu = modifyEventArray[i];
            if(modifyx.data.range.end.row < cu.data.range.start.row){
                // 在修改点上方 不需要调整
                continue;
            }
            else if(modifyx.data.range.start.row === cu.data.range.start.row &&
                modifyx.data.range.end.column < cu.data.range.start.column){
                // 在修改点前面 不需要调整位置
                continue;
            }
            else if(modifyx.data.range.start.row === cu.data.range.start.row &&
                modifyx.data.range.start.column < cu.data.range.start.column){
                // 要进行一个隐形的判断
                continue;
            }
            else if(cu.data.action == "insertText"){
                //首先判断是否插入换行符
                if(cu.data.text == "\n"){
                    modifyx.data.range.start.row++;
                    modifyx.data.range.end.row++;
                }
                else{
                    //如果不是插入换行符，那么判断是否在同一行
                    if(modifyx.data.range.start.row === cu.data.range.start.row){
                        //在同一行，就往后推
                        var delta = cu.data.range.end.column - cu.data.range.start.column;
                        modifyx.data.range.start.column += delta;
                        modifyx.data.range.end.column += delta;
                    }
                    else{
                        continue;
                    }
                }
            }
            else if(cu.data.action == "removeText"){
                //首先判断是否删除换行符
                if(cu.data.text == "\n"){
                    modifyx.data.range.start.row--;
                    modifyx.data.range.end.row--;
                }
                else{
                    //如果不是插入换行符，那么判断是否在同一行
                    if(modifyx.data.range.start.row === cu.data.range.start.row){
                        //在同一行，就往前推
                        var delta = cu.data.range.end.column - cu.data.range.start.column;
                        modifyx.data.range.start.column -= delta;
                        modifyx.data.range.end.column -= delta;
                    }
                    else{
                        continue;
                    }
                }
            }
            else if(cu.data.action == "insertLines"){
                //向下推
                var delta = cu.data.range.end.row - cu.data.range.start.row;
                modifyx.data.range.start.row += delta;
                modifyx.data.range.end.row += delta;
            }
            else if(cu.data.action == "removeLines"){
                //向上推
                var delta = cu.data.range.end.row - cu.data.range.start.row;
                modifyx.data.range.start.row -= delta;
                modifyx.data.range.end.row -= delta;
            }
        }
        return modifyx.data;
    }
    else{

    }
};