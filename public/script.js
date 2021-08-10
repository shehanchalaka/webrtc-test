const socket = io("/");
// const socket = io("https://api.stage.embracesg.io/");

// GLOBAL VARIABLES
let ACCESS_TOKEN = null;
let EVENT_ID = "6111e4b30f131b002d6377e1";
let myPeer;
let stream_map = {};

async function loginAsChalaka() {
  try {
    const res = await loginRequest("chalakaz@gmail.com", "1234");
    ACCESS_TOKEN = res.accessToken;
    console.log("Logged in as chalaka");

    init();
  } catch (err) {
    console.warn(err);
  }
}

async function loginAsVishva() {
  try {
    const res = await loginRequest("vishva.sudantha@gmail.com", "Test@1234");
    ACCESS_TOKEN = res.accessToken;
    console.log("Logged in as vishva");

    init();
  } catch (err) {
    console.warn(err);
  }
}

async function init() {
  try {
    // authenticate socket io
    // await authenticateSocket();

    // start and add my stream to html
    const stream = await startMyStream();
    addVideoStream(stream, true);

    // setup events
    setupPeerJsEvents(stream);

    // setup socket io events
    setupSocketEvents(stream);
  } catch (err) {
    console.warn(error);
  }
}

function disconnect() {
  myPeer.destroy();
}

async function loginRequest(email, password) {
  return new Promise((resolve, reject) => {
    const _email = encodeURIComponent(email);
    const _password = encodeURIComponent(password);
    var data = `email=${_email}&password=${_password}&strategy=local`;
    const xhr = new XMLHttpRequest();
    xhr.addEventListener("readystatechange", function () {
      if (this.readyState === 4 && this.status === 201) {
        const response = JSON.parse(this.responseText);
        resolve(response);
      }
      if (this.readyState === 4 && this.status === 401) {
        const response = JSON.parse(this.responseText);
        reject(response);
      }
    });
    xhr.open("POST", "https://api.stage.embracesg.io/authentication");
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.setRequestHeader("Access-Control-Allow-Origin", "*");
    xhr.send(data);
  });
}

async function authenticateSocket() {
  return new Promise((resolve, reject) => {
    if (socket.connected) {
      socket.emit(
        "create",
        "authentication",
        { strategy: "jwt", accessToken: ACCESS_TOKEN },
        (error) => {
          if (error) {
            console.warn(error);
            reject(error);
            return;
          }
          console.log("Socket authenticated");
          resolve("Socket authenticated");
        }
      );
    } else {
      console.warn("Socket not initialized");
      reject("Socket not initialized");
    }
  });
}

async function startMyStream() {
  return new Promise((resolve, reject) => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        resolve(stream);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function setupPeerJsEvents(stream) {
  myPeer = new Peer(undefined, {
    config: {
      iceServers: [
        { url: "stun:stun1.l.google.com:19302" },
        { url: "stun:stun2.l.google.com:19302" },
      ],
    },
  });

  myPeer.on("open", (peerId) => {
    console.log("PeerJs Opened. My Peer Id:", peerId);
    socket.emit(
      "patch",
      "voice-calls",
      null,
      { eventId: EVENT_ID, peerId },
      { joinCall: true, eventId: EVENT_ID }
    );
  });

  // when a call is received
  myPeer.on("call", (call) => {
    // immediately answer the call with my stream
    call.answer(stream);

    call.on("stream", (remoteStream) => {
      addVideoStream(remoteStream);
    });
    call.on("close", () => {
      // handle close event
    });
  });
}

function setupSocketEvents(stream) {
  socket.on("voice-calls user_connected", ({ peerId }) => {
    console.log("[Socket] user_connected:", peerId);
    connectToNewPeer(peerId, stream);
  });

  socket.on("voice-calls user_disconnected", ({ peerId }) => {
    console.log("[Socket] user_disconnected:", peerId);
    // if (peers[peerId]) peers[peerId].close();
  });
}

function connectToNewPeer(peerId, stream) {
  // call the new peer
  const call = myPeer.call(peerId, stream);

  call.on("stream", (remoteStream) => {
    addVideoStream(remoteStream);
  });
  call.on("close", () => {
    // handle close
  });
}

function addVideoStream(stream, muted = false) {
  if (stream_map[stream.id]) {
    return;
  }

  stream_map[stream.id] = true;

  const video = document.createElement("video");
  video.srcObject = stream;
  video.muted = muted;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  const videoGrid = document.getElementById("video-grid");
  videoGrid.append(video);
}
