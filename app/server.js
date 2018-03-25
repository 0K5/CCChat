var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

var users = {};
connections = [];

portNumber = 3000;

server.listen(process.env.PORT || portNumber);
console.log('Server (CCChat) running...');

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});
 

io.sockets.on('connection', function(socket){
	//Connect
	connections.push(socket);
	console.log("Number of connected sockets: " +connections.length);

	
	//Disconnect
	socket.on('disconnect', function(data){
		delete users[socket.nickname];
		updateUsernames();
		connections.splice(connections.indexOf(socket), 1);
		console.log("Number of connected sockets: " +connections.length);
		io.sockets.emit('user left', {user: socket.nickname});
		console.log(socket.nickname +" left the chatroom");
	});
	
	//Send Message
	socket.on('send message', function(data, callback){
		var msg = data.trim();
		if(msg.substring(0,3) == '/p '){
			msg = msg.substring(3);
			var i = msg.indexOf(' ');
			if(i != -1){
				var name = msg.substring(0, i);
				var msg = msg.substring(i + 1);
				if(name in users){
					users[name].emit('private message', {msg: msg, user: socket.nickname, timestamp: new Date(Date.now()).toUTCString()});
					console.log('private message');
				} else {
					callback('There is no user with such name. Please try again.');
				}
			} else {
				callback('The private message cannot be empty');
			}
			
		}
		else if(msg.substring(0,5) == '/list'){
			var socketid = socket.id;
			io.to(socketid).emit('user list', {list: Object.keys(users)});
		}
		else{
			io.sockets.emit('new message', {msg: msg, user: socket.nickname, timestamp: new Date(Date.now()).toUTCString()});
		}
	});
	
	//New User
	socket.on('new user', function(data, callback){
		if(data.username in users){
			callback(false);
		} else {
			callback(true);
			socket.nickname = data.username;
			users[socket.nickname] = socket;
			updateUsernames();
		//	io.sockets.emit('new user enlisted', {user: socket.nickname});
			io.sockets.emit('new user enlisted', {user: socket.nickname, timestamp: new Date(Date.now()).toUTCString()});			
			console.log(socket.nickname +" joined the chatroom");
		}
	});
	
	function updateUsernames(){
		io.sockets.emit('get users', Object.keys(users));
	}
	
});