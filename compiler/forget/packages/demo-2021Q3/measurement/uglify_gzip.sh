uglifyjs --compress --mangle -- Feed.babel.js > Feed.min.js
uglifyjs --compress --mangle -- Feed.hook.babel.js > Feed.hook.min.js
uglifyjs --compress --mangle -- Feed.forget.babel.js > Feed.forget.min.js

uglifyjs --compress --mangle -- Demo2.babel.js > Demo2.min.js
uglifyjs --compress --mangle -- Demo2.forget.babel.js > Demo2.forget.min.js

gzip -k Feed.min.js
gzip -k Feed.hook.min.js
gzip -k Feed.forget.min.js
gzip -k Demo2.min.js
gzip -k Demo2.forget.min.js
