const fs=require("fs");
const FILE="./sistemas/anticall.json";
function read(){try{return JSON.parse(fs.readFileSync(FILE,"utf8"))}catch{return{enabled:false}}}
function write(data){fs.mkdirSync("./sistemas",{recursive:true});fs.writeFileSync(FILE,JSON.stringify(data,null,2))}
function isAntiCall(){return read().enabled===true}
function setAntiCall(enabled){const d=read();d.enabled=!!enabled;write(d);return d.enabled}
module.exports={isAntiCall,setAntiCall};