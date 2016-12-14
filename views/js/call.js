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

var pc1, pc2, localStream, remoteStream;
var offerOptions = {
	offerToReceiveAudio: 1,
  offerToReceiveVideo: 1
}

function gotStream(stream){
	localVideo.srcObject = stream;
	localStream = stream;
}
function gotRemoteStream(stream){
	 remoteStream = stream;
  	video2.srcObject = stream;
  	trace('Received remote stream');
  }

function start() {
 navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true
        }).then(gotStream)
          .catch(e => alert("Not supported: " + e));
    }
function call(){
	var servers = {
          iceServers: [
              {urls: "stun:23.21.150.121"},
              {urls: "stun:stun.l.google.com:19302"},
              {urls: "turn:numb.viagenie.ca", credential: "webrtcdemo", username: "louis%40mozilla.com"}
          ]
        } 

        pc1 = new webkitRTCPeerConnection(servers);
        pc2 = new webkitRTCPeerConnection(servers);

        pc1.addStream(localStream);
        pc1.onicecandidate = function(e){
        	if(e.candidate){
        		pc2.addIceCandidate(
        			new RTCPeerIceCandidate(e.candidate); 
        		)
        	}
        }
}
pc2.onicecandidate = function(e){
	if(e.candidate){
		var peer = new RTCPeerIceCandidate(e.candidate);
		pc1.addIceCandidate(peer);
	}
}
pc2.onaddstream = function(e){
	remoteVideo.srcObject = e.stream;
}
pc1.createOffer().then(
	function(desc){
		console.log(local desc);
		pc1.setLocalDescrition(desc);
		pc2.setRemoteDescription(desc);

		pc2.createAnswer().then(
			function(desc2){
				console.log('pc2 answering');
	          	pc2.setLocalDescription(desc2);
	          	pc1.setRemoteDescription(desc2);
			}
		)
	}

)
