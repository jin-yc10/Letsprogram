var  mongodb = require('./db');

function  Apply(apply) {
    this.projID = apply.projID;
    this.user = apply.user;
    this.time = apply.time;
    this.message = apply.message;
    this.id= this.projID+this.user.name;
}
module.exports = Apply;

Apply.prototype.save = function  save(callback) {
    // 存入 Mongodb 的文档
    var  apply = {
        projID: this.projID,
        user: this.user,
        time: this.time,
        message: this.message,
        id: this.id
    };
    mongodb.open(function (err, db) {
        if (err) {
            return  callback(err);
        }
        // 读取 users 集合
        db.collection('applys', function (err, collection) {
            if (err) {
                mongodb.close();
                return  callback(err);
            }
            collection.ensureIndex('id', {unique:  true},function (err, inserted) {});
            collection.insert(apply, {safe: true},  function (err, apply) {
                mongodb.close();
                callback(err, apply);
            });
        });

    });
};

Apply.getById = function  get(id, callback) {
    mongodb.open(function(err, db) {
        if (err) {
            return  callback(err);
        }
        db.collection('applys', function(err, collection) {
            if (err) {
                mongodb.close();
                return  callback(err);
            }
            collection.findOne({id: id},  function (err, doc) {
                mongodb.close();
                if (doc) {
                    //  封装文档为 User 对象
                    var  apply =  new  Apply(doc);
                    callback(err, apply);
                } else {
                    callback(err, null);
                }
            });
        });
    });
};

Apply.getByProj =  function  get(projID, callback) {
    mongodb.open(function(err, db) {
        if (err) {
            return  callback(err);
        }
        db.collection('applys', function(err, collection) {
            if (err) {
                mongodb.close();
                return  callback(err);
            }
            var  query = {};
            query.projID = projID;
            collection.find(query).sort({time:  -1}).toArray( function (err, docs) {
                mongodb.close();
                if (err) {
                    callback(err, null);
                }
                var  applys = [];
                docs.forEach( function (doc, index) {
                    var apply = new Apply(doc);
                    applys.push(apply);
                });
                callback(null, applys);
            });
        });
    });
};

Apply.delete= function get(id,callback){
    mongodb.open(function(err, db) {
        if (err) {
            return  callback(err);
        }
        db.collection('applys', function(err, collection) {
            if (err) {
                mongodb.close();
                return  callback(err);
            }
            collection.remove({id: id},  function (err) {
                mongodb.close();
                return callback(err);
            });
        });
    });
};