var ffi = require('ffi-napi');
const ref = require('ref-napi')
const refArray = require('ref-array-napi')
var iconv = require('iconv-lite');
var path = require('path');


var dllPath = path.join(
    (__dirname.includes(".asar") ? process.resourcesPath : __dirname), 
    (__dirname.includes(".asar") ? './': '../') + 'assets/dll/Termb.dll'
    ) ;

console.log(dllPath)

var lib = ffi.Library(dllPath, {
    'CVR_InitComm': ['int', ['int']],
    'CVR_CloseComm': ['int',[]],
    'CVR_Authenticate': ['int',[]],
    'CVR_Read_FPContent': ['int', []],
    'GetPeopleName':['int' ,[ref.refType('char') , ref.refType('int')]],
    'GetPeopleIDCode':['int' ,[ref.refType('char') , ref.refType('int')]],
  })

var service ={
    InitComm:()=>{
        return lib.CVR_InitComm(1001);
    },
    CloseComm:()=>{
        return lib.CVR_CloseComm();
    },
    Authenticate:()=>{
        return lib.CVR_Authenticate();
    },
    ReadContent:()=>{
        return lib.CVR_Read_FPContent();
    },
    GetPeopleName:()=>{
        var handleRef = ref.alloc('int');
        // nodejs 8版本 写法
        // var lt = new Buffer(128).fill(" ");
        // nodejs 10+版本 写法
        var lt = Buffer.alloc(128," ");
        lib.GetPeopleName(lt , handleRef);
        return iconv.decode(lt, 'GBK');
    },
    GetPeopleIDCode:()=>{
        var handleRef = ref.alloc('int');        
        var lt = Buffer.alloc(128," ");
        lib.GetPeopleIDCode(lt , handleRef);
        return iconv.decode(lt, 'GBK');
    },
}  

module.exports = service;