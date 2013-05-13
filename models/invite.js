var  mongodb = require('./db');

function  Invite(invite) {
    this.projID = invite.projID;
    this.user = invite.user;
    this.inviter = invite.inviter;
    this.time = invite.time;
    this.message = invite.message;
    this.id= this.projID+this.user.name;
}
module.exports = Invite;

Invite.prototype.save = function  save(callback) {
    // 存入 Mongodb 的文档
    var  invite = {
        projID: this.projID,
        inviter: this.inviter,
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
        db.collection('invites', function (err, collection) {
            if (err) {
                mongodb.close();
                return  callback(err);
            }
            collection.ensureIndex('id', {unique:  true},function (err, inserted) {});
            collection.insert(invite, {safe: true},  function (err, invite) {
                mongodb.close();
                callback(err, invite);
            });
        });

    });
};

Invite.getById = function  get(id, callback) {
    mongodb.open(function(err, db) {
        if (err) {
            return  callback(err);
        }
        db.collection('invites', function(err, collection) {
            if (err) {
                mongodb.close();
                return  callback(err);
            }
            collection.findOne({id: id},  function (err, doc) {
                mongodb.close();
                if (doc) {
                    var  invite =  new  invite(doc);
                    callback(err, invite);
                } else {
                    callback(err, null);
                }
            });
        });
    });
};

Invite.getByProj =  function  get(projID, callback) {
    mongodb.open(function(err, db) {
        if (err) {
            return  callback(err);
        }
        db.collection('invites', function(err, collection) {
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
                var  invites = [];
                docs.forEach( function (doc, index) {
                    var invite = new Invite(doc);
                    invites.push(invite);
                });
                callback(null, invites);
            });
        });
    });
};

Invite.getByUser =  function  get(username, callback) {
    mongodb.open(function(err, db) {
        if (err) {
            return  callback(err);
        }
        db.collection('invites', function(err, collection) {
            if (err) {
                mongodb.close();
                return  callback(err);
            }
            var  query = {};
            query.user = username;
            collection.find(query).sort({time:  -1}).toArray( function (err, docs) {
                mongodb.close();
                if (err) {
                    callback(err, null);
                }
                var  invites = [];
                docs.forEach( function (doc, index) {
                    var invite = new Invite(doc);
                    invites.push(invite);
                });
                callback(null, invites);
            });
        });
    });
};

Invite.delete= function get(id,callback){
    mongodb.open(function(err, db) {
        if (err) {
            return  callback(err);
        }
        db.collection('invites', function(err, collection) {
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