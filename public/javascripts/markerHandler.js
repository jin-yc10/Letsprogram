/**
 * Created with JetBrains WebStorm.
 * User: Jin-yc10
 * Date: 13-5-10
 * Time: 上午10:02
 * To change this template use File | Settings | File Templates.
 */

var markerSet = {};

function myhandleIncomingMarkerMessage(object){
    var userName = object.userName;
    if(markerSet[userName] === undefined){
        markerSet[userName] = {};
        markerSet[userName].markerID = -1;
    }
    var session = editor.getSession();
    var obRange = object.payLoad;
    var x = ace.require('ace/range');
    var newRange = new x.Range(obRange.start.row, obRange.start.column, obRange.end.row, obRange.end.column);
    if(markerSet[userName].markerID != -1){
        session.removeMarker(markerSet[userName].markerID);
    }
    markerSet[userName].markerID = session.addMarker(newRange, "myMarker", "text", false);
}