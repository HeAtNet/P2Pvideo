$( document ).ready(() => {
  $('.tabs').tabs({
    swipeable: true,
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
