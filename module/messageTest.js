const tools = require('./tools')
tools.send("18339696437").then(res=>{
    console.log(2222,res)
}).catch(err=>{
    console.log(3333,err)
})