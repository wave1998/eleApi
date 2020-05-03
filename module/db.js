const mongodb = require("mongodb");
const mongoClient = mongodb.MongoClient;
const url = "mongodb://127.0.0.1:27017";
// 连接数据库
function _connect() {
    return new Promise((resolve,reject)=>{
        mongoClient.connect(url,{useNewUrlParser: true, useUnifiedTopology: true},function (err,client) {
            if(err){
                reject("连接失败");
            }else{
                const db = client.db("ele16");
                resolve(db);
            }
        })
    })

}
/*
* 添加一条文档记录
* 1、collName:指定集合的名字
* 2、insertObj:指定插入的文档*/
module.exports.insertOne = async function (collName,insertObj) {
    const db = await _connect();// 获得数据库信息
    return new Promise((resolve,reject)=>{
        db.collection(collName).insertOne(insertObj,function (err,results) {
            if(err)
                reject(err);
            else
                resolve(results);
        })
    })

}
/*
* 根据条件获得文档数量
* 1、collName:集合名字
* 2、whereObj:条件*/
module.exports.count = async function (collName,whereObj = {}) {
    const db = await _connect();
    return new Promise((resolve,reject)=>{
        db.collection(collName).countDocuments(whereObj).then(num=>{
            resolve(num)
        })
    })
}
// 查找
module.exports.find = async function (collName,{whereObj={},limit=0,skip=0,sortObj={}}) {
    const db = await _connect();
    return new Promise((resolve,reject)=>{
        db.collection(collName)
            .find(whereObj)
            .limit(limit)
            .skip(skip)
            .sort(sortObj)
            .toArray((err,results)=>{
                if(err)
                    reject(err);
                else
                    resolve(results);
            });
    })
}

module.exports.findOne = async function (collName,whereObj = {}) {
    const db = await _connect();
    return new Promise((resolve,reject)=>{
        db.collection(collName).findOne(whereObj,function (err,results) {
            if(err)
                reject(err);
            else
                resolve(results);
        })
    })

}
//根据ID获得指定内容
module.exports.findOneById = async function(collName,id){
    const db = await _connect();
    return new Promise((resolve,reject)=>{
        db.collection(collName).findOne({
            _id:mongodb.ObjectId(id)
        },function(err,results){
            if(err) reject(err);
            else resolve(results)
        })
    })
}

module.exports.updateOne = async function(collName,whereObj,updateObj){
    const db = await _connect();
    return new Promise((resolve,reject)=>{
        db.collection(collName).updateOne(whereObj,updateObj,function (err,results) {
            if(err)
                reject(err);
            else
                resolve(results);
        })
    })
}
// 根据ID更新你的数据。
module.exports.updateOneById = async function (collName,_id,updateObj) {
    const db = await _connect();
    return new Promise((resolve,reject)=>{
        db.collection(collName).updateOne({
            _id:mongodb.ObjectId(_id)
        },updateObj,function (err,results) {
            if(err)
                reject(err);
            else
                resolve(results);
        })
    })

}

// 根据Id进行删除
module.exports.deleteOneById = async function (collName,id) {
    const db = await _connect();
    return new  Promise((resolve,reject)=>{
        db.collection(collName).deleteOne({_id:mongodb.ObjectId(id)},function (err,results) {
            if(err)
                reject(err);
            else
                resolve(results);
        })
    })
}


module.exports.pageData = async function(collName,pageIndex,obj){
    obj = obj || {};
    const {whereObj = {},limit=0,sortObj={}} = obj;
    const count = await this.count(collName,whereObj);
    let pageSum = 1;
    if(count > 0) pageSum = Math.ceil(count/limit);
    if(pageSum < 1) pageSum = 1;
    if(pageIndex < 1) pageIndex = 1;
    else if(pageIndex > pageSum) pageIndex = pageSum;
    const skip = (pageIndex-1)*limit;
    const results = await this.find(collName,{
        whereObj,
        skip,
        limit,
        sortObj
    });
    return{
        pageSum,
        pageIndex,
        [collName]:results//[变量]  将变量的值作为属性
    }
}