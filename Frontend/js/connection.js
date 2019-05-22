let peer = null;
let lastPeerId = null;
let conn = null;
let vconn = null;
let ownStream = null;
let globalCallReceivedCallback = null;
let globalCallEndedCallback = null;
let optionCamStatus = false;
let optionMicStatus = false;
const P2P = {};

P2P.init = (callReceivedCallback, callEndedCallback) => {
  globalCallReceivedCallback = callReceivedCallback;
  globalCallEndedCallback = callEndedCallback;
  peer = new Peer();
  console.log('Init p2p');
  peer.on('open', () => {
    if (peer.id === null) {
      console.log('Received null id from peer open');
      peer.id = lastPeerId;
    } else {
      lastPeerId = peer.id;
    }
    $('#codeword-input').val(peer.id);
    console.log('ID: ' + peer.id);
  });

  // Receive call
  peer.on('call', call => {
    vconn = call;
    call.answer(ownStream); // Answer the call with an A/V stream.
    console.log('t:startstream');
    call.on('stream', remoteStream => {
      // Show stream in some video/canvas element.
      console.log('t:remotestream');
      document.getElementById('video-other').srcObject = remoteStream;
    });
  });

  // Connection received
  peer.on('connection', c => {
    if (conn) { // Allow only a single connection
      c.on('open', () => {
        c.send('Already connected to another client');
        setTimeout(() => {
          c.close();
        }, 500);
      });
      return;
    }

    conn = c;
    console.log('Connected to: ' + conn.peer);
    callReceivedCallback();

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        ownStream = stream;
        ownStream.getVideoTracks()[0].enabled = optionCamStatus;
        ownStream.getAudioTracks()[0].enabled = optionMicStatus;
        document.getElementById('video-own').srcObject = ownStream;
        conn.send('svideoStream');
      })
      .catch((error) => {
        console.error(error);
      });

    conn.on('data', data => {
      if (data === 'sclose') {
        P2P.close();
      } else {
        console.log('Data recieved', data);
      }
    });
    conn.on('close', () => {
      conn = null;
      P2P.close();
    });
  });
  peer.on('disconnected', () => {
    console.log('Connection lost. Please reconnect');

    // Workaround for peer.reconnect deleting previous id
    peer.id = lastPeerId;
    peer._lastServerId = lastPeerId;
    peer.reconnect();
  });
  peer.on('close', () => {
    conn = null;
    P2P.close();
    console.log('Connection destroyed');
  });
  peer.on('error', err => {
    console.log(err);
  });
};

P2P.startCall = (id) => {
  // Close old connection
  if (conn) {
    conn.close();
  }

  conn = peer.connect(id, {
    reliable: true,
  });
  conn.on('open', () => {
    console.log('Connected to: ' + conn.peer);
    globalCallReceivedCallback();
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        ownStream = stream;
        ownStream.getVideoTracks()[0].enabled = optionCamStatus;
        ownStream.getAudioTracks()[0].enabled = optionMicStatus;
        document.getElementById('video-own').srcObject = ownStream;
      })
      .catch((error) => {
        console.error(error);
      });
  });
  conn.on('data', (data) => {
    if (data === 'svideoStream') {
      if (vconn) {
        vconn.close();
      }
      vconn = peer.call(id, ownStream);
      console.log('J:startstream');
      vconn.on('stream', remoteStream => {
        // Show stream in some video/canvas element.
        console.log('J:remotestream');
        document.getElementById('video-other').srcObject = remoteStream;
      });
    } else if (data === 'sclose') {
      P2P.close();
    } else {
      console.log(data);
    }
  });
  conn.on('close', () => {
    conn = null;
    P2P.close();
    console.log('close');
  });
};

P2P.setCamStatus = status => {
  optionCamStatus = status;
  if (ownStream && ownStream.getVideoTracks && ownStream.getVideoTracks().length) {
    ownStream.getVideoTracks()[0].enabled = status;
  }
};

P2P.setMicStatus = status => {
  optionMicStatus = status;
  if (ownStream && ownStream.getAudioTracks && ownStream.getAudioTracks().length) {
    ownStream.getAudioTracks()[0].enabled = status;
  }
};

P2P.close = () => {
  if (conn) {
    conn.send('sclose');
    setTimeout(() => {
      if (conn) {
        conn.close();
        conn = null;
      }
    }, 400);
  }
  if (vconn) {
    vconn.close();
    vconn = null;
  }
  if (ownStream) {
    ownStream.getAudioTracks()[0].stop();
    ownStream.getVideoTracks()[0].stop();
  }
  setTimeout(globalCallEndedCallback, 400);
};
