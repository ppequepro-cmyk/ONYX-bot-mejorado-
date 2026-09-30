const {esOwner}=require("../sistemas/premium");
const {isAntiCall,setAntiCall}=require("../sistemas/anticall");
module.exports={
  commands:["anticall","antillamada"],
  async handler(conn,{message,args}){
    const jid=message.key.remoteJid;
    if(!esOwner(jid)) return conn.sendMessage(jid,{text:"❌ Este comando es solo para el Owner."},{quoted:message});
    const action=String(args[0]||"status").toLowerCase();
    if(action==="on"||action==="activar"){
      setAntiCall(true);
      return conn.sendMessage(jid,{text:"📵 AntiCall activado. ONYX rechazará automáticamente las llamadas entrantes."},{quoted:message});
    }
    if(action==="off"||action==="desactivar"){
      setAntiCall(false);
      return conn.sendMessage(jid,{text:"📞 AntiCall desactivado. ONYX ya no rechazará automáticamente las llamadas."},{quoted:message});
    }
    return conn.sendMessage(jid,{text:"📵 AntiCall: "+(isAntiCall()?"✅ ACTIVADO":"❌ DESACTIVADO")+"\n\nUsa /anticall on o /anticall off."},{quoted:message});
  }
};