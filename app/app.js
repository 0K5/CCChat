let fs = require('fs');
let express = require('express')
let http = require('http');
let app = express();
let server = http.createServer(app);
let io = require('socket.io')(server);
let path = require('path');
let port = 3000;
let handlebars = require('express-handlebars');

//Setting up mime types for babylon');
let mimeTypes = {
    ".html" : "text/html",
    ".css" : "text/css",
    ".js" : "application/javascript",
    ".png" : "image/png",
    ".gif" : "image/gif",
    ".jpg" : "image/jpeg",
    ".fx" : "application/fx",
    ".babylon" : "application/babylon",
    ".babylonmeshdata" : "application/babylonmeshdata"
};
express.static.mime.define(mimeTypes);

//Setting up routes');

//Setting up handlebars');
app.engine('hbs', handlebars({extname: 'hbs', defaultLayout: 'main', layoutsDir: __dirname + '/views/layouts/'}));
app.set('views', path.join(__dirname,'views/'));
app.set('view engine','hbs');

//Initializing express application');
app.use(express.static(path.join(__dirname,'/public')));
app.get('/', function (req, res, next) {
    res.render('index.hbs',{title:'RPSGame'}); 
});

server.listen(port);
