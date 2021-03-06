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

const addMessage = (message, own) => {
  message = message.replace(/</g, '&lt;');
  message = message.replace(/>/g, '&gt;');
  message = message.replace(/\n---\n/g, '\n<hr>');
  message = message.replace(/\*(.+?)\*/g, '<b>$1</b>');
  message = message.replace(/_(.+?)_/g, '<i>$1</i>');
  message = message.replace(/~(.+?)~/g, '<s>$1</s>');
  message = message.replace(/```\n([\w\W]+?)\n```/g, '<pre>$1</pre>');
  message = message.replace(/`(.+?)`/g, '<span class="code">$1</span>');
  message = message.replace(/ /g, '&nbsp;');
  message = message.replace(/\n/g, '<br>');

  const links = message.match(/((?:http|ftp|https):\/\/(?:[\w+?\.\w+])+(?:[a-zA-Z0-9\~\!\@\#\$\%\^\&\*\(\)_\-\=\+\\\/\?\.\:\;\'\,]*))/g); // eslint-disable-line
  message = message.replace(/((?:http|ftp|https):\/\/(?:[\w+?\.\w+])+(?:[a-zA-Z0-9\~\!\@\#\$\%\^\&\*\(\)_\-\=\+\\\/\?\.\:\;\'\,]*))/g, '<a href="$1" target="_blank">$1</a>'); // eslint-disable-line

  const msgClass = own ? 'right blue-grey lighten-5' : 'left white';
  const msgElement = $('<div class="card-panel ' + msgClass + '">');
  msgElement.html($('<p>').html(message));

  if (links) {
    links.forEach(link => {
      const p = $('<p>');
      const youtube = link.match(/^(?:http:|https:)?\/\/(?:www\.)?youtu(?:be)?(?:-nocookie)?\.(?:(?:(?:com).*?(?:v=|v\/|a=|embed\/|vi=|vi\/|e\/))|(?:be\/)|(?:com\/user\/.+\/))([^?&/#\n]+).*$/);
      if (youtube && youtube[1]) {
        p.addClass('nopadding');
        p.html(`<iframe src="https://www.youtube.com/embed/${youtube[1]}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`);
      } else {
        p.html(`<a href="${link}" target="_blank">${link}</a>`);
      }
      msgElement.append(p);
    });
  }
  $('#message-box').append(msgElement);
};
const startVideo = (id, iteration) => {
  console.log('Try to start video stream', id, iteration);
  if (vconn) {
    vconn.close();
  }
  vconn = peer.call(id, ownStream);
  if (vconn) {
    vconn.on('stream', remoteStream => {
      // Show stream in some video/canvas element.
      document.getElementById('video-other').srcObject = remoteStream;
    });
    vconn.on('error', () => {
      console.error('video error');
    });
  } else if (iteration && iteration > 0) {
    setTimeout(() => {
      startVideo(id, iteration - 1);
    }, 500);
  }

};

P2P.init = (callReceivedCallback, callEndedCallback) => {
  globalCallReceivedCallback = callReceivedCallback;
  globalCallEndedCallback = callEndedCallback;
  peer = new Peer();
  console.log('Init p2p');
  peer.on('open', () => {
    if (peer.id === null) {
      peer.id = lastPeerId;
    } else {
      lastPeerId = peer.id;
    }
    console.log('ID: ' + peer.id);
  });

  // Receive call
  peer.on('call', call => {
    vconn = call;
    call.answer(ownStream); // Answer the call with an A/V stream.
    call.on('stream', remoteStream => {
      // Show stream in some video/canvas element.
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
      })
      .catch((error) => {
        console.error(error);
      });

    conn.on('data', data => {
      if (data === 'svideoStream') {
        conn.send('svideoStream');
      } else if (data === 'sclose') {
        P2P.close();
      } else if (data.substr(0, 1) === 'u') {
        addMessage(data.substr(1), false);
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
    // Workaround for peer.reconnect deleting previous id
    peer.id = lastPeerId;
    peer._lastServerId = lastPeerId;
    peer.reconnect();
  });
  peer.on('close', () => {
    conn = null;
    P2P.close();
  });
  peer.on('error', err => {
    console.log(err);
    globalCallEndedCallback();
  });
};

P2P.startCall = (id) => {
  const connectFv = id => {
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
          setTimeout(() => {
            startVideo(id, 5);
          }, 500);
        })
        .catch((error) => {
          console.error(error);
        });
    });
    conn.on('data', (data) => {
      if (data === 'svideoStream') {
        startVideo(id, 5);
      } else if (data === 'sclose') {
        P2P.close();
      } else if (data.substr(0, 1) === 'u') {
        addMessage(data.substr(1), false);
      } else {
        console.log(data);
      }
    });
    conn.on('close', () => {
      conn = null;
      P2P.close();
    });
  };

  if (id && id[0] === '#') {
    connectFv(id.substr(1));
  } else {
    $.post('/api/call', JSON.stringify({
      'codeword': id,
      'myid': peer.id,
    }), 'application/json' )
      .done(resp => {
        if (resp.type === 'from') {
          console.log('Start call...');
          connectFv(resp.otherid);
        } else if (resp.type === 'to') {
          console.log('Keep waiting...');
        }
      })
      .fail(resp => {
        console.log( 'error', resp);
        globalCallEndedCallback();
      });
  }
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

P2P.message = message => {
  if (conn && message !== '') {
    conn.send('u' + message);
    addMessage(message, true);
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

P2P.camRetry = () => {
  if (conn) {
    conn.send('svideoStream');
  }
};
