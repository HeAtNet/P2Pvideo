$( document ).ready(() => {
  $('.tabs').tabs({
    swipeable: true,
  });

  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then((stream) => {
      document.getElementById('video-other').srcObject = stream;
      document.getElementById('video-own').srcObject = stream;
    });
});

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
