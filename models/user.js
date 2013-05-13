var  mongodb = require('./db');

function  User(user) {
    this.name = user.name;
    this.password = user.password;
    this.avatar = user.avatar;
}
module.exports = User;

User.prototype.save = function  save(callback) {
    // 存入 Mongodb 的文档
    var  user = {
        name: this.name,
        password: this.password,
        avatar:this.avatar
    };
    mongodb.open(function (err, db) {
        if (err) {
            return  callback(err);
        }
        // 读取 users 集合
        db.collection('users', function (err, collection) {
            if (err) {
                mongodb.close();
                return  callback(err);
            }
            // 为 name 属性添加索引
            collection.ensureIndex('name', {unique:  true},function (err, inserted) {});
            // 写入 user  文档
            collection.insert(user, {safe: true},  function (err, user) {
                mongodb.close();
                callback(err, user);
            });
        });

    });
};

User.get =  function  get(username, callback) {
    mongodb.open(function(err, db) {
        if (err) {
            return  callback(err);
        }
        // 读取 users 集合
        db.collection('users', function(err, collection) {
            if (err) {
                mongodb.close();
                return  callback(err);
            }
            // 查找 name  属性为 username 的文档
            if (username==null || username==""){

                collection.find({}).toArray(function (err,docs){
                    mongodb.close();
                    if (err) {
                        callback(err, null);
                    }
                    var  users = [];
                    docs.forEach( function (doc, index) {
                        var  user =  new  User(doc);
                        users.push(user);
                    });
                    callback(null, users);
                });
            }
            else{
                collection.findOne({name: username},  function (err, doc) {
                    mongodb.close();
                    if (doc) {
                        //  封装文档为 User 对象
                        var  user =  new  User(doc);
                        callback(err, user);
                    } else {
                        callback(err, null);
                    }
                });
            }


        });
    });
};

User.modify = function modify(username, password_modification, callback){
    mongodb.open(function(err, db) {
        if (err) {
            return  callback(err);
        }
        // 读取 users 集合
        db.collection('users', function(err, collection) {
            if (err) {
                mongodb.close();
                return  callback(err);
            }
            // 查找 name  属性为 username 的文档
            collection.update({name: username}, {$set:{password:password_modification }}, function (err) {
                mongodb.close();
                if(err){
                    return callback("inner error");
                }
                callback(null);

            });

        });
    });
};