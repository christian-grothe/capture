let context;
let synthNode;
let osc;

async function initAudio(){
    context = new AudioContext();
    await context.audioWorklet.addModule("./capture_processor.js");
    osc = new OscillatorNode(context);
    synthNode = new AudioWorkletNode(context, "capture");
    osc.connect(synthNode);
    synthNode.connect(context.destination);
    osc.start();
}

function handleStart(){
    initAudio();
    context.resume();
}

function handleRec(){
    synthNode.port.postMessage("rec")
}
function handlePlay(){
    synthNode.port.postMessage("play")
}
function handleStop(){
    synthNode.port.postMessage("stop")
}


window.addEventListener("load", async()=>{
    document.getElementById("start").addEventListener("click", handleStart);
    document.getElementById("rec").addEventListener("click", handleRec);
    document.getElementById("play").addEventListener("mousedown", handlePlay);
    document.getElementById("play").addEventListener("mouseup", handleStop);
})

