let showModal = null;
let deferredPrompt = null;

let redrawContacts = null;
let checkInContacts = null;
let saveCodeword = null;
let deleteContact = null;

let makeCall = null;
let endCall = null;
let callReceived = null;
let callEnded = null;

let redrawOptionButtons = null;
let switchCamStatus = null;
let switchMicStatus = null;
let openFullscreen = null;
let closeFullscreen = null;
let changeFullScreen = null;

showModal = (content, buttons, callback) => {
  $('#modal-save .modal-content').html(content);
  $('#modal-save .modal-footer').html('');

  buttons.forEach((item, index) => {
    const btn = $('<a class="modal-close waves-effect waves-green btn">');
    btn.html(item);
    btn.click(() => {
      callback(index);
    });
    $('#modal-save .modal-footer').append(btn);
  });

  const instance = M.Modal.getInstance($('#modal-save')[0]);
  instance.open();
};

// Functions for contact management
redrawContacts = () => {
  const data = JSON.parse(localStorage.getItem('contactCodewords') || '[]');
  if (data.length === 0) {
    $('#window-contacts-container').html('<center>No contacts saved</center>');
  } else {
    $('#window-contacts-container').html('');
    data.forEach(item => {
      const button = $('<a class="secondary-content"><i class="material-icons">clear</i></a>');
      const contact = $('<li class="collection-item">');
      contact.html(item);
      contact.click(() => {
        makeCall(item);
      });
      button.click(() => {
        deleteContact(item);
      });
      contact.append(button);
      $('#window-contacts-container').append(contact);
    });
  }
};
checkInContacts = (cw) => {
  const data = JSON.parse(localStorage.getItem('contactCodewords') || '[]');
  let isNew = true;
  data.forEach(item => {
    if (isNew && item === cw) {
      isNew = false;
    }
  });
  return !isNew;
};
saveCodeword = (cw) => {
  const data = JSON.parse(localStorage.getItem('contactCodewords') || '[]');
  if (!checkInContacts(cw)) {
    data.push(cw);
  }
  localStorage.setItem('contactCodewords', JSON.stringify(data));
  redrawContacts();
};
deleteContact = (cw) => {
  let data = JSON.parse(localStorage.getItem('contactCodewords') || '[]');
  data = data.filter(item => item !== cw);
  localStorage.setItem('contactCodewords', JSON.stringify(data));
  redrawContacts();
};

// Functions for call management

makeCall = (cw) => {
  $('.window').addClass('hiddenwindow');
  $('#window-wait').removeClass('hiddenwindow');

  console.log('Call ', cw);
  P2P.startCall(cw);
};
endCall = () => {
  P2P.close();
};
callReceived = () => {
  $('.window').addClass('hiddenwindow');
  $('#window-call').removeClass('hiddenwindow');
};
callEnded = () => {
  $('.window').addClass('hiddenwindow');
  $('#window-base').removeClass('hiddenwindow');
};

let optionCamStatus = true;
let optionMicStatus = true;
redrawOptionButtons = () => {
  $('.js-btn-cam').toggleClass('lighten-4', !optionCamStatus);
  $('.js-btn-mic').toggleClass('lighten-4', !optionMicStatus);

  $('.js-btn-cam .material-icons').text('videocam' + (optionCamStatus ? '' : '_off'));
  $('.js-btn-mic .material-icons').text('mic' + (optionMicStatus ? '' : '_off'));
};
switchCamStatus = () => {
  optionCamStatus = !optionCamStatus;
  P2P.setCamStatus(optionCamStatus);
  redrawOptionButtons();
};
switchMicStatus = () => {
  optionMicStatus = !optionMicStatus;
  P2P.setMicStatus(optionMicStatus);
  redrawOptionButtons();
};

openFullscreen = () => {
  const elem = document.documentElement;
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.mozRequestFullScreen) {
    elem.mozRequestFullScreen();
  } else if (elem.webkitRequestFullscreen) {
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) {
    elem.msRequestFullscreen();
  }
};
closeFullscreen = () => {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }
};
changeFullScreen = () => {
  if ( window.fullScreen || (window.innerWidth === window.screen.width && window.innerHeight === window.screen.height) ) {
    closeFullscreen();
  } else {
    openFullscreen();
  }
};

// INIT
$( document ).ready(() => {
  // INIT MATERIALIZE
  $('.tabs').tabs({
    swipeable: true,
  });
  $('.modal').modal();

  setTimeout(() => {
    $('#window-base').removeClass('hiddenwindow');
  }, 600);
  redrawContacts();
  redrawOptionButtons();

  if (localStorage.getItem('installprompt') !== 'false') {
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      deferredPrompt = e;
    });
  }

  // ADD FUNFTIONS
  const callFunction = () => {
    const codeword = $('#codeword-input').val();
    $('#codeword-input').val('');
    if (codeword === '') {
      return;
    }
    if (checkInContacts(codeword)) {
      makeCall(codeword);
      return;
    }
    showModal(`Save '${codeword}' codeword into contacts?`, [
      'Save & Call',
      'Call',
    ], e => {
      if (e === 0) {
        saveCodeword(codeword);
      }
      makeCall(codeword);
    });
  };
  $('.js-btn-call').click(callFunction);
  $('#codeword-input').on('keyup', e => {
    switch (e.keyCode) {
    case 13: // enter
      callFunction();
      break;
    case 27: // esc
      $('#codeword-input').val('');
      break;
    }
  });
  $(document).on('keydown', e => {
    switch (e.keyCode) {
    case 122: // F11
      changeFullScreen();
      e.preventDefault();
      return false;
    }
    return true;
  });
  $('.js-btn-end').click(endCall);
  $('.js-btn-cam').click(switchCamStatus);
  $('.js-btn-mic').click(switchMicStatus);
  $('.js-btn-cht').click(() => {
    M.Tabs.getInstance($('#tabs-swipe-call')[0]).select('tab-window-chat');
  });
  $('.js-btn-vid').click(() => {
    M.Tabs.getInstance($('#tabs-swipe-call')[0]).select('tab-window-webcam');
  });
  $('.js-btn-ful').click(changeFullScreen);
  $('#btn-message-send').click(() => {
    P2P.message($('#message-input').val());
    $('#message-input').val('');
    M.textareaAutoResize($('#message-input'));
  });
  $('#message-input').on('keydown', e => {
    switch (e.keyCode) {
    case 13: // enter
      if (!e.shiftKey) {
        P2P.message(e.target.value);
        e.target.value = '';
        M.textareaAutoResize($('#message-input'));
        e.preventDefault();
        return false;
      }
      break;
    case 27: // esc
      e.target.value = '';
      break;
    }
    return true;
  });
  let hideCallElementsTimeout;
  $('#window-call').on('mousemove', () => {
    if (hideCallElementsTimeout) {
      clearTimeout(hideCallElementsTimeout);
    }
    hideCallElementsTimeout = setTimeout(() => {
      $('.btn-video-container.down').addClass('slidedown');
      $('#tab-window-webcam').addClass('inactive');
    }, 2000);
    $('.btn-video-container.down').removeClass('slidedown');
    $('#tab-window-webcam').removeClass('inactive');
  });

  document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
      $('.js-btn-ful .material-icons').text('fullscreen_exit');
    } else {
      $('.js-btn-ful .material-icons').text('fullscreen');
    }
  });

  P2P.init(callReceived, callEnded);

  const path = window.location.pathname.substr(1).split('/');

  let checkTimeout = null;
  let hasCamPermission = false;
  let hasMicPermission = false;
  new Promise( (resolve, reject) => {
    if ('mediaDevices' in navigator) {
      return resolve();
    }
    return reject();
  }).catch(() => {
    console.error('mediaDevices not supported');
  }).then(() => {
    checkTimeout = setTimeout(() => {
      $('.overlay').html('<i class="blue-text large material-icons">videocam</i><br>Enable webcam!');
      $('.overlay').fadeIn();
    }, 2000);
    return navigator.mediaDevices.getUserMedia({video: true});
  }).then(stream => {
    clearTimeout(checkTimeout);
    $('.overlay').fadeOut();
    stream.getVideoTracks()[0].stop();
    hasCamPermission = true;
  }, () => {
    clearTimeout(checkTimeout);
    $('.overlay').fadeOut();
    console.error('Webcam not enabled');
  }).then(() => {
    checkTimeout = setTimeout(() => {
      $('.overlay').html('<i class="blue-text large material-icons">mic</i><br>Enable microphone!');
      $('.overlay').fadeIn();
    }, 2000);
    return navigator.mediaDevices.getUserMedia({audio: true});
  }).then(stream => {
    clearTimeout(checkTimeout);
    $('.overlay').fadeOut();
    stream.getAudioTracks()[0].stop();
    hasMicPermission = true;
  }, () => {
    clearTimeout(checkTimeout);
    $('.overlay').fadeOut();
    console.error('Microphone not enabled');
  }).then(() => {
    if (!hasCamPermission || !hasMicPermission) {
      $('.overlay').fadeIn();
      $('.overlay').html(
        '<i class="' + (hasCamPermission ? 'green' : 'red') + '-text large material-icons">videocam' + (hasCamPermission ? '' : '_off') + '</i><br>Webcam: <span class="' + (hasCamPermission ? 'green' : 'red') + '-text">' + (hasCamPermission ? 'ENABLED' : 'DISABLED') + '</span>' + '<br><br>' +
        '<i class="' + (hasMicPermission ? 'green' : 'red') + '-text large material-icons">mic' + (hasMicPermission ? '' : '_off') + '</i><br>Microphone: <span class="' + (hasMicPermission ? 'green' : 'red') + '-text">' + (hasMicPermission ? 'ENABLED' : 'DISABLED') + '</span>'
      );
    } else if (path[0] === 'c') {
      makeCall(path[1]);
    } else if (deferredPrompt) {
      showModal('Would you like to add this app to the homescreen?', [
        'Add',
        'Not now',
        'Never',
      ], e => {
        if (e === 0) {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then(choiceResult => {
            if (choiceResult.outcome === 'accepted') {
              console.log('User accepted the A2HS prompt');
            } else {
              console.log('User dismissed the A2HS prompt');
            }
            deferredPrompt = null;
          });
        }
        if (e === 2) {
          localStorage.setItem('installprompt', 'false');
        }
      });
    }
  });
});

// SERVICE WORKER
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/service-worker.js')
    .then(() => {
      console.log('Service worker registered');
    })
    .catch(error => {
      console.error('Could not register service worker');
      console.error(error);
    });
} else {
  console.error('Service workers not supported');
}
