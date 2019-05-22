let showModal = null;

let redrawContacts = null;
let checkInContacts = null;
let saveCodeword = null;
let deleteContact = null;

let makeCall = null;
let endCall = null;
let callReceived = null;

let redrawOptionButtons = null;
let switchCamStatus = null;
let switchMicStatus = null;

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
  setTimeout(callReceived, 2000); // temp
};
endCall = () => {
  $('.window').addClass('hiddenwindow');
  $('#window-base').removeClass('hiddenwindow');
};
callReceived = () => {
  $('.window').addClass('hiddenwindow');
  $('#window-call').removeClass('hiddenwindow');
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
  redrawOptionButtons();
};
switchMicStatus = () => {
  optionMicStatus = !optionMicStatus;
  redrawOptionButtons();
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
  $('.js-btn-end').click(endCall);
  $('.js-btn-cam').click(switchCamStatus);
  $('.js-btn-mic').click(switchMicStatus);
  $('.js-btn-cht').click(() => {
    M.Tabs.getInstance($('#tabs-swipe-call')[0]).select('tab-window-chat');
  });
  $('.js-btn-vid').click(() => {
    M.Tabs.getInstance($('#tabs-swipe-call')[0]).select('tab-window-webcam');
  });

  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then((stream) => {
      document.getElementById('video-other').srcObject = stream;
      document.getElementById('video-own').srcObject = stream;
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

/*
let deferredPrompt;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
});

document.querySelector('button').addEventListener('click', () => {
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(choiceResult => {
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the A2HS prompt');
    } else {
      console.log('User dismissed the A2HS prompt');
    }
    deferredPrompt = null;
  });
});
*/
