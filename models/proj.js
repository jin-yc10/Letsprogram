var  mongodb = require('./db');
var User = require('./user.js');

function  Proj(proj,time) {
    this.name = proj.name;
    this.admin= proj.admin;
    if (proj.member)
        this.member=proj.member;
    else{
        this.member=new Array();
        this.member[0]=this.admin;
    }

    this.id = this.admin+proj.name;

    this.lang=proj.lang;
    this.docTree=null;
    if (time){
        this.lastUpdate=time;
    }
    else if(proj.time){
        this.lastUpdate=proj.time;
    }
    else {
        this.lastUpdate=new Date();
    }
}
module.exports = Proj;

Proj.prototype.save = function  save(callback) {
    // 存入 Mongodb 的文档
    var  proj = {
        id: this.id,
        name: this.name,
        admin: this.admin,
        member: this.member,

        lang: this.lang,
        docTree: this.docTree,

        lastUpdate :this.lastUpdate
    };
    mongodb.open(function (err, db) {
        if (err) {
            return  callback(err);
        }
        // 读取 users 集合
        db.collection('projs', function (err, collection) {
            if (err) {
                mongodb.close();
                return  callback(err);
            }
            // 为 name 属性添加索引
            collection.ensureIndex('id', {unique:  true},function (err, inserted) {});
            // 写入 user  文档
            collection.insert(proj, {safe: true},  function (err, user) {
                mongodb.close();
                callback(err, user);
            });
        });

    });
};

Proj.get =  function  get(projid, callback) {
    mongodb.open(function(err, db) {
        if (err) {
            return  callback(err);
        }
        db.collection('projs', function(err, collection) {
            if (err) {
                mongodb.close();
                return  callback(err);
            }
            // 查找 name  属性为 username 的文档
            collection.findOne({id: projid},  function (err, doc) {
                mongodb.close();
                if (doc) {
                    //  封装文档为 User 对象
                    var  proj =  new  Proj(doc);
                    callback(err, proj);
                } else {
                    callback(err, null);
                }
            });
        });
    });
};

Proj.getByName =  function  get(projname, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return  callback(err);
        }
        db.collection('projs', function (err, collection) {
            if (err) {
                mongodb.close();
                return  callback(err);
            }
            var  query = {};
            if (projname) {
                query.name = projname;
            }
            collection.find(query).sort({time:  -1}).toArray( function (err, docs) {
                mongodb.close();
                if (err) {
                    callback(err, null);
                }
                var  projs = [];
                docs.forEach( function (doc, index) {
                    var  proj =  new  Proj(doc,doc.time);
                    projs.push(proj);
                });
                callback(null, projs);
            });
        });
    });
};

Proj.getByUser =  function  get(user, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return  callback(err);
        }
        db.collection('projs', function (err, collection) {
            if (err) {
                mongodb.close();
                return  callback(err);
            }
            var  query = {};
            if (user) {
                query.member = {"$in":[user]};
            }
            collection.find(query).sort({time:  -1}).toArray( function (err, docs) {
                mongodb.close();
                if (err) {
                    callback(err, null);
                }
                var  projs = [];
                docs.forEach( function (doc, index) {
                    var  proj =  new  Proj(doc,doc.time);
                    projs.push(proj);
                });
                callback(null, projs);
            });
        });
    });
};

Proj.addMember=function get(projid,member,callback){
    mongodb.open(function(err, db) {
        if (err) {
            return  callback(err);
        }
        db.collection('projs', function(err, collection) {
            if (err) {
                mongodb.close();
                return  callback(err);
            }
            collection.update({id: projid}, { $push:{"member":member}},
                function (err) {
                    mongodb.close();
                    callback(err);
                });
        });
    });
};

Proj.deleteMember=function get(projid,member,callback){
    mongodb.open(function(err, db) {
        if (err) {
            return  callback(err);
        }
        db.collection('projs', function(err, collection) {
            if (err) {
                mongodb.close();
                return  callback(err);
            }
            // 查找 name  属性为 username 的文档
            collection.update({id: projid}, { $pull:{"member":member}},
                function (err) {
                    mongodb.close();
                    callback(err);
                });
        });
    });
};