console.log('Init js');
let peer = null;
let lastPeerId = null;
let conn = null;
let ownStream = null;
let globalCallReceivedCallback;

const P2P = {};

P2P.init = (callReceivedCallback) => {
  globalCallReceivedCallback = callReceivedCallback;
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
        document.getElementById('video-own').srcObject = ownStream;
      });

    conn.on('data', data => {
      console.log('Data recieved', data);
    });
    conn.on('close', () => {
      conn = null;
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
  });
  conn.on('data', (data) => {
    console.log(data);
  });
  conn.on('close', () => {
    console.log('close');
  });

  navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then((stream) => {
      ownStream = stream;
      document.getElementById('video-own').srcObject = ownStream;

      const call = peer.call(id, ownStream);
      console.log('J:startstream');
      call.on('stream', remoteStream => {
        globalCallReceivedCallback();

        // Show stream in some video/canvas element.
        console.log('J:remotestream');
        document.getElementById('video-other').srcObject = remoteStream;
      });
    })
    .catch((error) => {
      console.error(error);
    });
};

P2P.setCamStatus = status => {
  if (ownStream && ownStream.getVideoTracks && ownStream.getVideoTracks().length) {
    ownStream.getVideoTracks()[0].enabled = status;
  }
};

P2P.setMicStatus = status => {
  if (ownStream && ownStream.getAudioTracks && ownStream.getAudioTracks().length) {
    ownStream.getAudioTracks()[0].enabled = status;
  }
};
