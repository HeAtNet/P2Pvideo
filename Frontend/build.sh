rm dist -r
mkdir dist
mkdir dist/css
mkdir dist/js
mkdir dist/assets
mkdir dist/assets/images

cp -r fonts dist

cp css/materialize.min.css dist/css/materialize.min.css
cp css/style.min.css dist/css/style.min.css
cp js/jquery-3.4.1.min.js dist/js/jquery-3.4.1.min.js
cp js/materialize.min.js dist/js/materialize.min.js
cp js/scripts.min.js dist/js/scripts.min.js
cp js/peerjs.min.js dist/js/peerjs.min.js

cp service-worker.js dist/service-worker.js
cp manifest.webmanifest dist/manifest.webmanifest
cp index.html dist/index.html

cp assets/images/logo-144.png dist/assets/images/logo-144.png
cp assets/images/logo-192.png dist/assets/images/logo-192.png
cp assets/images/logo-512.png dist/assets/images/logo-512.png
cp assets/images/logo-150x50.png dist/assets/images/logo-150x50.png
