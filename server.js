const express = require("express");
const mongodb = require("mongodb");
const bodyParser = require("body-parser");
const db = require("./module/db");
const tools = require("./module/tools");
const {upPic} = require('./module/upPic');
const app = express();
app.use(express.static(__dirname+"/upload"));
app.use(bodyParser.json());
let adminInfo = null;


/********************************管理员********************************************************/
//登录并添加登录日志
app.post('/login',async function (req,res) {
     const {adminName,passWord} = req.body;
     const results = await db.findOne("adminList",{
         adminName,
         passWord:tools.enMd5(passWord)
     });
     if(results){
         await db.insertOne('adminLog',{
             adminId:results._id,
             adminName:results.adminName,
             loginTime:Date.now()
         })
         res.json({
             ok:1,
             adminName:results.adminName,
             token:tools.encode({
                 adminName:results.adminName,
             })
         })
     }else{
         tools.json(res,"-1","账号或密码错误")
     }
})
app.all("*",function (req,res,next) {
    const deResult = tools.decode(req.headers.authorization);
    if(deResult.ok===3){
        adminInfo = deResult.info;
        next()
    }else{
        tools.json(res,2,"接口请求异常")
    }
});
//获取登录日志列表
app.get('/adminLog',async function(req,res) {

        const adminName = adminInfo.adminName;
        let pageIndex = req.query.pageIndex/1;
        let pageSum = 1;
        let limit = 6;
        const count =await db.count('adminLog',{adminName})
        pageSum = Math.ceil(count/limit);
        if(pageSum <1)
            pageSum = 1
        if(pageIndex <1)
            pageIndex = 1
        if(pageIndex > pageSum)
            pageIndex = pageSum
        const adminLog = await db.find('adminLog',{
            whereObj:{
              adminName
            },
            sortObj:{
                loginTime:-1
            },
            skip:(pageIndex-1)*limit,
            limit
        });
        setTimeout(function(){
            res.json({
                ok:1,
                adminLog,
                pageIndex,
                pageSum
            })
        },300)
})
//获取管理员列表
app.get('/adminList',async function(req,res) {
        const adminId = adminInfo._id;
        let pageIndex = req.query.pageIndex/1;
        let pageSum = 1;
        let limit = 6;
        const count =await db.count('adminList')
        pageSum = Math.ceil(count/limit);
        if(pageSum <1)
            pageSum = 1
        if(pageIndex <1)
            pageIndex = 1
        if(pageIndex > pageSum)
            pageIndex = pageSum
        const adminList = await db.find('adminList',{
            sortObj:{
                adminId:1
            },
            skip:(pageIndex-1)*limit,
            limit
        });
        setTimeout(function(){
            res.json({
                ok:1,
                adminList,
                pageIndex,
                pageSum
            })
        },300)
})



/************************************************店铺类别接口********************************/
// 上传店铺类别信息
app.post('/shopType',async function (req,res) {
    const status = await upPic(req,"shopTypePic")
    if(status.ok===1){
        await db.insertOne("shopTypeList",{
            shopTypeName:status.params.shopTypeName,
            shopTypePic:status.params.newPicName,
            createTime:Date.now()
        })
        tools.json(res,1,"插入成功")
    }else{
        tools.json(res)
    }
})
//获取渲染所需店铺类别信息
app.get('/shopTypeList',async function (req,res) {
    let whereObj = {};
    let pageIndex = req.query.pageIndex/1;
    let pageSum = 1;
    let limit = 3;
    // 判断有无关键字
    let shopTypeName = req.query.shopTypeName || "";
    if(shopTypeName !== ""){
        whereObj.shopTypeName = new RegExp(shopTypeName)
    }
    const count = await db.count("shopTypeList",whereObj);
    pageSum = Math.ceil(count/limit);
    if(pageSum < 1)
        pageSum = 1;
    if(pageIndex > pageSum)
        pageIndex = pageSum;
    if(pageIndex < 1)
        pageIndex = 1;
    const shopTypeList = await db.find("shopTypeList",{
        whereObj,
        sortObj:{
            createTime:-1
        },
        skip:(pageIndex-1)*limit,
        limit
    });
    res.json({
        ok:1,
        shopTypeList,
        pageIndex,
        pageSum
    })
})
//获取所有店铺类别信息用于下拉
app.get("/allShopTypeList",async function(req,res) {
    const shopTypeList = await db.find("shopTypeList",{
        sortObj:{
            createTime: -1
        }
    })
    res.json({
        ok:1,
        shopTypeList,
    })
})
//通过Id得到修改所需的店铺类别信息
app.get("/getShopTypeById",async function(req,res) {
    const shopTypeInfo = await db.findOneById("shopTypeList",req.query.shopTypeId)
    res.json({
        ok:1,
        shopTypeInfo
    })
})
//修改店铺类型信息
app.put("/shopTypeList",async function(req,res) {
    const {ok,params} = await upPic(req,"shopTypePic");
    if(ok === -1)
        tools.json(res);
    else {
        // 成功
        const $set = {
            shopTypeName: params.shopTypeName,
            createTime: Date.now()
        }
        if (ok === 1) {
            $set.shopTypePic = params.newPicName
        }
        await db.updateOneById("shopTypeList", params.shopTypeId, {$set});
        res.json({
            ok: 1,
            msg: "修改成功"
        })
    }
})



/**********************************店铺接口*****************************************************/
// 上传店铺信息
app.post("/shopList",async function(req,res) {
    const status = await upPic(req,"shopPic")
    if(status.ok===1){
        const shopType =await db.findOneById("shopTypeList",status.params.shopTypeId)
        await db.insertOne("shopList",{
            shopName:status.params.shopName,
            shopPic:status.params.newPicName,
            createTime:Date.now(),
            isTop:status.params.isTop === "true",
            shopTypeName:shopType.shopTypeName,
            shopTypeId:shopType._id,
        })
        tools.json(res,1,"插入成功")
    }else{
        tools.json(res)
    }
})
//获取渲染页面所需的店铺信息
app.get("/shopList",async function(req,res) {
    let pageIndex = req.query.pageIndex/1;
    let pageSum = 1;
    let limit = 3;
    let whereObj = {};
    if(req.query.shopTypeId.length>0){
        whereObj.shopTypeId = mongodb.ObjectId(req.query.shopTypeId)
    }
    // 判断有无关键字
    let keyWord = req.query.keyWords || "";
    if(keyWord !== ""){
        whereObj.shopTypeName = new RegExp(keyWord)
    }
    const count = await db.count("shopList",whereObj);
    pageSum = Math.ceil(count/limit);
    if(pageSum < 1)
        pageSum = 1;
    if(pageIndex > pageSum)
        pageIndex = pageSum;
    if(pageIndex < 1)
        pageIndex = 1;
    const shopList = await db.find("shopList",{
        whereObj,
        sortObj:{
            createTime:-1
        },
        skip:(pageIndex-1)*limit,
        limit
    });
    res.json({
        ok:1,
        shopList,
        pageIndex,
        pageSum
    })
})
//根据店铺类别Id获取所有店铺信息用于下拉
app.get("/allShopList/:shopTypeId",async function(req,res) {
    const whereObj={};
    whereObj.shopTypeId =mongodb.ObjectId(req.params.shopTypeId);
    const shopList = await db.find("shopList",{
        whereObj,
        sortObj:{
            createTime: -1
        }
    })
    res.json({
        ok:1,
        shopList,
    })
})




/*************************************商品类别接口****************************************************/
//添加商品类别
app.post("/goodsTypeList",async function(req,res) {
    const {_id,shopName,shopTypeId,shopTypeName} = await db.findOneById("shopList",req.body.shopId);
    await db.insertOne("goodsTypeList",{
        goodsTypeName:req.body.goodsTypeName,
        shopId:_id,
        shopName,
        shopTypeId,
        shopTypeName,
        createTime:Date.now()
    });
    res.json({
        ok:1,
        msg:"添加成功"
    })
})
//获取渲染页面所需的商品类别列表
app.get('/goodsTypeList',async function (req,res) {
    let whereObj = {};
    let pageIndex = req.query.pageIndex/1;
    let pageSum = 1;
    let limit = 3;
    if(req.query.shopId !== "")
        whereObj.shopId = mongodb.ObjectId(req.query.shopId) || "";
    const count = await db.count("goodsTypeList",whereObj);
    pageSum = Math.ceil(count/limit);
    if(pageSum < 1)
        pageSum = 1;
    if(pageIndex > pageSum)
        pageIndex = pageSum;
    if(pageIndex < 1)
        pageIndex = 1;
    const goodsTypeList = await db.find("goodsTypeList",{
        whereObj,
        sortObj:{
            createTime:-1
        },
        skip:(pageIndex-1)*limit,
        limit
    });
    res.json({
        ok:1,
        goodsTypeList,
        pageIndex,
        pageSum
    })
})
//根据店铺Id获取所有商品类别信息用于下拉
app.get("/goodsTypeList/:shopId",async function(req,res) {
    const whereObj={};
    whereObj.shopId =mongodb.ObjectId(req.params.shopId);
    const goodsTypeList = await db.find("goodsTypeList",{
        whereObj,
        sortObj:{
            createTime: -1
        }
    })
    res.json({
        ok:1,
        goodsTypeList,
    })
})



/****************************************商品接口*************************************************************/
//添加商品
app.post("/goodsList",async function(req,res) {
    const status = await upPic(req,"goodsPic")
    if(status.ok===1){
        const goodsType =await db.findOneById("goodsTypeList",status.params.goodsTypeId)
        await db.insertOne("goodsList",{
            createTime:Date.now(),
            goodsPic:status.params.newPicName,
            isTop:status.params.isTop === "true",
            goodsName:status.params.goodsName,
            goodsPrice:status.params.goodsPrice,
            shopTypeName:goodsType.shopTypeName,
            shopTypeId:goodsType.shopTypeId,
            shopName:goodsType.shopName,
            shopId:goodsType.shopId,
            goodsTypeId:goodsType._id,
            goodsTypeName:goodsType.goodsTypeName,
        })
        tools.json(res,1,"插入成功")
    }else{
        tools.json(res)
    }
})
//获取渲染页面所需的商品列表
app.get('/goodsList',async function (req,res) {
    let whereObj = {};
    let pageIndex = req.query.pageIndex/1;
    let pageSum = 1;
    let limit = 3;
    if(req.query.goodsTypeId !== "")
        whereObj.goodsTypeId = mongodb.ObjectId(req.query.goodsTypeId) || "";
    const count = await db.count("goodsList",whereObj);
    pageSum = Math.ceil(count/limit);
    if(pageSum < 1)
        pageSum = 1;
    if(pageIndex > pageSum)
        pageIndex = pageSum;
    if(pageIndex < 1)
        pageIndex = 1;
    const goodsList = await db.find("goodsList",{
        whereObj,
        sortObj:{
            createTime:-1
        },
        skip:(pageIndex-1)*limit,
        limit
    });
    res.json({
        ok:1,
        goodsList,
        pageIndex,
        pageSum
    })
})




/*****************************************操作********************************************************/
//删除
app.delete("/del",async function(req,res){
    const id = req.query.id;
    const collName = req.query.collName;
    await db.deleteOneById(collName,id)
    res.json({
        ok:1,
        msg:"成功"
    })
})
//查询密码是否正确
app.post("/verifyPassWord",async function(req,res) {
    const {adminName,passWord} = req.body;
    const results = await db.findOne("adminList",{
        adminName,
        passWord:tools.enMd5(passWord)
    });
    if(results){
        res.json({
            ok:1,
        })
    }else{
        tools.json(res,"-1","账号或密码错误")
    }
})
//更改密码
app.put("/updatePassWord",async function(req,res) {
    try{
        const {adminName,newPassWord} = req.body;
        const results = await db.findOne("adminList",{
            adminName,
        });
        const adminId = results._id;
        let $set ={
            passWord:tools.enMd5(newPassWord)
        }
        await db.updateOneById("adminList",adminId,{$set})
        tools.json(res,1,"修改成功")
    }catch ({msg}) {
        tools.json(res,-1,msg)
    }
})







app.listen(8080,function () {
    console.log("success")
})