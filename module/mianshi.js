// function test2() {
//     return 25
// }
// console.log(typeof test2())

// var name = 'aaa';
// var obj = {
//     name:'bbb',
//     dose:function () {
//         this.name='ccc'
//     }
// }
// var does = obj.dose;
// does();
// console.log(obj.name)

// var a=[1,2,3,]
// var b=a;
// b.push(4)
// console.log(a)

// const querystring=require('querystring');
// const str = "a=b&c=d";
// const obj = querystring.parse(str,'&')
// console.log(obj)
//
// document.querySelectorAll("li")

var str = "Web2.0"
pattern = /(\w)(\d)\.(\d)/i
utCome=pattern.exec(str);
console.log(utCome)