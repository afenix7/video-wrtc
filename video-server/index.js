import {connect, createServer} from 'nodejs-websocket'
let rooms = {}
let init = ()=>{
    let serv = createServer(conn=>{
        conn.on("text", msg=> {
            console.log("Received: "+msg)
            const json = JSON.parse(msg)
            if(json.type=='init'){
                let rid = json.rid
                let uid = json.uid
                if(rooms[rid]){
                    if(rooms[rid].indexOf(uid)==-1)
                        rooms[rid].push(uid)
                }
                else{
                    rooms[rid] = []
                    rooms[rid].push(uid)
                }
                console.log("now rooms="+JSON.stringify(rooms))
                conn.sendText(JSON.stringify({type:'room',users:rooms[rid]}))
            }
            else if(json.type=='destroy'){
                let rid  = json.rid
                let uid = json.uid
                rooms[rid].splice(rooms[rid].indexOf(uid),1)
                if(rooms[rid].length<1) rooms.rid = undefined
                console.log("now rooms="+JSON.stringify(rooms))
                conn.sendText(JSON.stringify({type:'room',users:rooms[rid]}))
            }
            else{
                conn.sendText(msg)
            }
        });
        conn.on("connect",code=>{
            console.log('连接'+code)
        });
        conn.on("close", function (code, reason) {
            console.log("Connection closed")
        });
        conn.on('error',err=>{
            console.log(err)
        })
    }).listen(8002);
    console.log("listening 8002")
}
export {init}
init()