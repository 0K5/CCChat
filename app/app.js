let path = require('path');
let port = 3000;
let handlebars = require('express-handlebars');

//Setting up App');
let express = require('express')
let app = express();
let fs = require('fs');
let forceSsl = require('express-force-ssl');
app.use(forceSsl);
app.use(express.json());
//Setting up Server');
let https = require('https');
let key = fs.readFileSync('ssl/client-key.pem');
let cert = fs.readFileSync('ssl/client-cert.pem');
let options = {
    key: key,
    cert: cert
};
let httpsServ = https.createServer(options, app).listen(port);
let http = require('http');
let httpServ = http.createServer(app).listen(port+1000);

//Setting up mime types for babylon');
let mimeTypes = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".png": "image/png",
    ".gif": "image/gif",
    ".jpg": "image/jpeg",
    ".fx": "application/fx",
    ".babylon": "application/babylon",
    ".babylonmeshdata": "application/babylonmeshdata"
};
express.static.mime.define(mimeTypes);

//Setting up routes');

//Setting up sockets');
let io = require('socket.io')(httpsServ);

//Setting up handlebars');
app.engine('hbs', handlebars({
    extname: 'hbs',
    defaultLayout: 'main',
    layoutsDir: __dirname + '/views/layouts/'
}));
app.set('views', path.join(__dirname, 'views/'));
app.set('view engine', 'hbs');

//Initializing express application');
app.use(express.static(path.join(__dirname, '/public')));
app.get('/', function(req, res, next) {
    res.render('index.hbs', {
        title: 'RPSGame'
    });
});

