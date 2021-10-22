///<reference path="node_modules/@types/three/src/Three.d.ts" />

let vtex,cv,cam;
let scn,rd,geo,vmtl;
const v = document.querySelector('#v'),v1=document.querySelector('#v1')
v.onloadedmetadata = e=>{
    v.play();
}; 

v1.onloadedmetadata = e=>{
    v1.play();
}; 
v1.onclick = e=>{
    start()
}
const ws = new WebSocket('ws://localhost:8002')
let uid=window.sessionStorage.getItem('uid')
if(!uid){
    uid = THREE.MathUtils.generateUUID()
    window.sessionStorage.setItem('uid',uid)
}
ws.onopen = e=>{
    console.log('open:'+e)
    ws.send(JSON.stringify({type:'init',rid:0,uid:uid}))
}
ws.onerror = err=>{
    console.log(err)
}
ws.onclose = e => {
    console.log("closee:"+e)
    ws.send(JSON.stringify({type:'destroy',rid:0,uid:uid}))
}
ws.onmessage = async e => {
    console.log(e.data)
    let json = JSON.parse(e.data)
    if (json.type === 'candidate') {
        local_peer.addIceCandidate(new RTCIceCandidate(json.data.candidate));
    }
    else if(json.type=='offer'){
        await local_peer.setRemoteDescription(json.data.offer)
        let answer = await local_peer.createAnswer()
        await local_peer.setLocalDescription(answer)
        ws.send(JSON.stringify({
            type:'answer',
            uid:uid,
            data:{
                answer:answer
            }
        }))
    }
    else if(json.type=='answer'){
        local_peer.setRemoteDescription(new RTCSessionDescription(json.data.answer))

    }
    else if(json.type=='room'){
        console.log(json)
    }
}
const conn_config = {
    iceServers:[{urls:'stun:stun1.google.com:19302'}]
}
const local_peer = new RTCPeerConnection(conn_config)
const remote_peer = new RTCPeerConnection(conn_config)
// const local_peer = new RTCPeerConnection()
// const sendCh = peer.createDataChannel('sendch')
// sendCh.onopen = e=>{
//     console.log("open:"+e)
// }
// sendCh.onclose = e=>{
//     console.log("close:"+e)
// }
local_peer.onicecandidate = e => {
    console.log(e)
    if (e.candidate) {
        ws.send(JSON.stringify({
            type: 'candidate',
            data:{candidate: e.candidate},
            uid:uid
        }));
    } 
};
remote_peer.ontrack = e=>{
    console.log(e)
    v1.srcObject = e.streams[0]
}
let draw = ()=>{
    rd.render(scn,cam);
    window.requestAnimationFrame(draw);
};
let start = async ()=>{
    let stream = await navigator.mediaDevices.getUserMedia({video:true,audio:false})
    v.srcObject = stream
    stream.getTracks().forEach(it=>{
        local_peer.addTrack(it,stream)
    })
    let offer = await local_peer.createOffer();
    await local_peer.setLocalDescription(offer)
    ws.send(JSON.stringify({
        type:'offer',
        uid:uid,
        data:{
            offer:offer
        }
    }))
}
let init_render = ()=>{
    cv = window;
    vtex = new THREE.VideoTexture(v);
    cam = new THREE.PerspectiveCamera(45,cv.innerWidth/cv.innerHeight,1,1000);
    cam.position.z = 20;
    cam.lookAt(new THREE.Vector3(0,0,0));
    scn = new THREE.Scene();
    rd = new THREE.WebGLRenderer();
    rd.setSize(cv.innerWidth,cv.innerHeight);
    vmtl = new THREE.MeshBasicMaterial({map:vtex});
    geo = new THREE.BoxBufferGeometry(20,10,1);
    scn.add(new THREE.Mesh(geo,vmtl));
    // let dl = new THREE.DirectionalLight(0xffffff,0.5);
    // dl.position.set(0,20,20);
    // scn.add(dl);
    document.body.appendChild(rd.domElement);
    draw();
}
window.onresize = e=>{
    cam.aspect = cv.innerWidth / cv.innerHeight;
    cam.updateProjectionMatrix();
    rd.setSize(cv.innerWidth, cv.innerHeight);
}
window.onabort = e=>{
    console.log("abort:"+e)
    ws.send(JSON.stringify({type:'destroy',rid:0,uid:uid}))
    ws.close()
    local_peer.close()
}
start();
init_render();