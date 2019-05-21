rm dist -r
mkdir dist
mkdir dist/css
mkdir dist/js

cp -r fonts dist

cp css/materialize.min.css dist/css/materialize.min.css
cp css/style.min.css dist/css/style.min.css
cp js/jquery-3.4.1.min.js dist/js/jquery-3.4.1.min.js
cp js/materialize.min.js dist/js/materialize.min.js
cp js/scripts.min.js dist/js/scripts.min.js
cp index.html dist/index.html