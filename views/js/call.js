/* workflow: A calls B. A share network info, stream(user media)
1. This is done by A: A create a new RTC peer connection OBJECT with "onicecandidate" handler
1.1 What A send? SDP: session description protocol, A run createOffer() method
which have a callback: in this callback function, A will setLocalDescription(), which will send SDP
How? send SDP by websocket, socketIO or whatever.
2. Handler run after collect all the info about network, stream, ... Right now RTCPeerConnection() will
collect candidates info
3. After B get what A sends, B will setRemoteDescription(), set whatever A sends as remote SD
and addIceCandidate()
Now B ill do the same thing, using createAnswer() method to send SD (which have
been set as setLocalDescrition() to A. A will setRemoteDescription().
DONE AND DONE!!!
 */

/* get user media by
	first: run gotStream() method, which will set the localStream
	next run navigator.getUserMedia() to get the video info (audio? video constraint?) -> then run gotStream()
	to add the stream to the video element
*/
var socket = io();
var id = 123;
//send through login
socket.emit('login', {'id': id});
socket.on('dataReceived', onReceive);

var callDuration;
var localVideo = document.getElementById('localVideo');
var remoteVideo = document.getElementById('remoteVideo');

var callButton = document.getElementById("callButton");
var startButton = document.getElementById("startButton");
startButton.onclick = start;
callButton.disable = true;
callButton.onclick = call;

var pc1, pc2, localStream;
var offerOptions = {
	offerToReceiveAudio: 1,
  offerToReceiveVideo: 1
}

function getOtherPc(pc) {
  return (pc === pc1) ? pc2 : pc1;
}

function gotStream(stream){
	localVideo.srcObject = stream;
  localStream = stream;
  callButton.disable = false;
}

function start(){
	navigator.mediaDevices.getUserMedia({
		audio: true,
		video: true
	}).then(gotStream)
		.catch(e => alert("Not supported: " + e));
}

function call(){
	callButton.disable = true;
	var videoTracks = localStream.getVideoTracks();
	var audioTracks = localStream.getAudioTracks();

//setup the server there
	var servers = {
		iceServers: [
        {urls: "stun:23.21.150.121"},
        {urls: "stun:stun.l.google.com:19302"},
        {urls: "turn:numb.viagenie.ca", credential: "webrtcdemo", username: "louis%40mozilla.com"}
    ]
	}

  pc1 = new webkitRTCPeerConnection(servers);
	pc1.onicecandidate = e => onIceCandidate(pc1, e);
	pc2 = new webkitRTCPeerConnection(servers);
	pc2.onicecandidate = e => onIceCandidate(pc2, e);

	//set pc2 stream = remoteStream
	pc2.addStream = gotRemoteStream;
	pc1.addStream(localStream);

	pc1.createOffer(offerOptions)
		.then(onCreateOfferSuccess)
}

//callback
function onCreateOfferSuccess(desc) {
  // console.log(desc.sdp);
  
  pc1.setLocalDescription(desc);
  pc2.setRemoteDescription(desc);
  //now start createAnswre
  pc2.createAnswer()
  	.then(onCreateAnswerSuccess)
  	.catch(e => alert(e))
}

function gotRemoteStream(e){
	remoteVideo.srcObject = e.stream;
}
function onCreateAnswerSuccess(desc) {
  pc2.setLocalDescription(desc);
  pc1.setRemoteDescription(desc);
}
function onIceCandidate(pc, event){
	 if(event.candidate){
	 		getOtherPc(pc).addIceCandidate(new RTCIceCandidate(event.candidate))
	 }
}
