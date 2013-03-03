#!/usr/bin/env node
var WebSocketServer = require('websocket').server;
var http = require('http');

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});

server.listen(8080, function() {
    console.log((new Date()) + ' Server is listening on port 8080');
});

wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

var users = [];
var connections = [];

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }

    var connection = request.accept('echo-protocol', request.origin);
    connections.push(connection);
    users.push("anon");

    console.log(connection.remoteAddress + " connected - Protocol Version " + connection.webSocketVersion);

    // Send all the existing canvas commands to the new client
    connection.sendUTF(JSON.stringify({
        msg: "welcome",
        data: users
    }));

    // Handle closed connections
    connection.on('close', function() {
        console.log(connection.remoteAddress + " disconnected");
        
        var index = connections.indexOf(connection);
        if (index !== -1) {
            // remove the connection from the pool
            connections.splice(index, 1);
            users.splice(index, 1); 
        }
    });

    connection.on('message', function(message) {
        // console.log(message);
        if (message.type === 'utf8') {
            // console.log('Received Message: ' + message.utf8Data);

            var command = JSON.parse(message.utf8Data);
            var index = connections.indexOf(connection);

            if (command.msg == "register") {
                var index = connections.indexOf(connection);
                if (index !== -1) {
                    users[index] = command.data;
                }
            } else if (command.msg == "vs") {
                for(var i=0; i<connections.length; i++){
                    if(i == index) continue;
                    // console.log('i m ',index);
                    connections[i].sendUTF(JSON.stringify({
                        msg: "vs",
                        id: index,
                        data: command.data
                    }));
                }    
            } 


            // Send all the existing canvas commands to the new client
            
        }
        else if (message.type === 'binary') {
            // console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            connection.sendBytes(message.binaryData);
        }
    });

});