const express = require("express");
const tools = require("./module/tools")
const db = require("./module/db")
const app = express();
const mongodb = require("mongodb")
const bodyParser = require('body-parser')
app.use(bodyParser.json())
app.use(express.static(__dirname+"/upload"));//拼接
let adminInfo = null;

app.get("/send",async function (req,res) {
    const phoneId = req.query.phoneId;
    const code = tools.getRandom(100000,999999)
    // 根据手机号去短信集合中查看是否有记录
    const messageInfo = await db.findOne('phoneCode',{phoneId})
    if(messageInfo){
        if(Date.now()-messageInfo.sendTime>1*60*1000){
            // 过期了,可以重发
            db.updateOne("phoneCode",{_id:messageInfo._id},{$set:{sendTime:Date.now(),code}})
            res.json({
                ok:1,
                msg:"成功",
                code
            })
        }else{
            // 没过期
            tools.json(res,-1,"时间未到，还差"+Number.parseInt((1*60*1000-(Date.now()-messageInfo.sendTime))/1000)+"秒")
        }
    }else{
        await  db.insertOne("phoneCode",{
            phoneId,
            code,
            sendTime: Date.now()
        })
        res.json({
            ok:1,
            msg:"成功",
            code,
        })
    }
})
app.post("/login",async function(req,res) {
    const {phoneId,code} = req.body;
    if(code){
        const whereObj={phoneId}
        const info = await db.findOne('phoneCode',whereObj)
        if(info){
            if(Date.now()-info.sendTime>1000*60*5){
                console.log("过期了")
                //过期了
                tools.json(res,-1,"验证码已过期，请重新发送")
            }else{
                const user = await db.findOne("userList",{phoneId});
                if(user){
                    await db.updateOne("userList",{phoneId},{
                        $set:{
                            loginTime: Date.now()
                        }
                    });
                    res.json({
                        ok:1,
                        token:tools.encode({
                           phoneId,
                        }),
                        msg:"登陆成功"
                    })
                }else{
                    await db.insertOne("userList",{
                        phoneId,
                        loginTime: Date.now(),
                        regTime:Date.now(),
                        moneySum:100000,
                    })
                    res.json({
                        ok:1,
                        token:tools.encode({
                            phoneId,
                        }),
                        msg:"注册并登陆成功"
                    })
                }
            }
        }else{
            res.json({
                ok:-1,
                msg:"验证码错误"
            })
        }
    }else{
        res.json({
            ok:-1,
            msg:"请填写验证码或手机号"
        })
    }
})
app.all("*", function (req,res,next) {
    const deResult= tools.decode(req.headers.authorization)
    if(deResult.ok===3){
        adminInfo = deResult.info;
        next()
    }else{
        tools.json(res,2,"接口请求异常")
    }
})
app.get("/search",async function(req,res) {
    const keyword = req.query.keyword || "";
    const whereObj = {}
    if(keyword !== ""){
        whereObj.shopName = new RegExp(keyword)
    }
    const shopList = await db.find("shopList",{
        whereObj,
        sortObj:{
            createTime:-1,
        },
    })
    res.json({
        ok:1,
        shopList,
    })
})
// 首页轮播图
app.get("/shopTypeList",async function(req,res) {
    const limit = (req.query.limit || 60)/1;
    const results = await db.find("shopTypeList",{
        limit,
        sortObj:{
            createTime: -1
        }
    })
    res.json({
        ok:1,
        shopTypeList:tools.changeArr(results)
    })
})
// 推荐商家
app.get("/reShopList",async function(req,res) {
    let pageIndex = req.query.pageIndex/1;
    let pageSum = 1;
    let limit = 6;
    let whereObj = {};
    whereObj.isTop = true;
    const count = await db.count("shopList",whereObj);
    pageSum = Math.ceil(count/limit);
    if(pageSum < 1)
        pageSum = 1;
    if(pageIndex > pageSum)
        pageIndex = pageSum;
    if(pageIndex < 1)
        pageIndex = 1;
    const reShopList = await db.find("shopList",{
        whereObj,
        sortObj:{
            createTime:-1
        },
        skip:(pageIndex-1)*limit,
        limit
    });
        res.json({
            ok:1,
            reShopList,
            pageIndex,
            pageSum
        })


})
// 根据类别Id获取对应的店铺列表
app.get("/shopListById",async function(req,res) {
    const whereObj = {}
    whereObj.shopTypeId = mongodb.ObjectId(req.query.shopTypeId);
    const shopList = await db.find("shopList",{
        whereObj,
        sortObj:{
            createTime:-1
        }
    })
    console.log(shopList)
    res.json({
        ok:1,
        shopList,
    })
})

app.listen(8088,function () {
    console.log("success")
})