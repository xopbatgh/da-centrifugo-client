const http = require('http');
const axios = require('axios');
const DaClientExport = require('./index.js');

var DaClient = DaClientExport.DaClient ;

const hostname = '127.0.0.1';
const port = 3001;

var socket_connection_token = undefined;
var da_user_id = undefined;
var access_token = undefined;

var daClientItem = {};

const server = http.createServer(function(req, res) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');

    //var result = daClientItem.dumpVariables();

    var result = (daClientItem.dumpVariables()) ;

    //console.log(daClientItem.messages);

    res.end(result);
});

server.listen(port, hostname, function() {
    console.log('Server running at http://${hostname}:${port}/');

    daClientItem = new DaClient(da_user_id, socket_connection_token, access_token);

    // is fired on connection successful and ready to receive messages
    daClientItem.onConnected(function(client){

        console.log('Success: ' + client.user_id);

    });

    // is fired on connection failed and client is not ready and never become so
    daClientItem.onFailed(function(client){

        console.log('Failed: ' + client.user_id);

    });

    // on any new message from DA Centrifugo received
    daClientItem.onNewMessage(function(client, message){

        console.log('Message from: ' + client.user_id);
        console.log(message);

    });

    // on donation message received only
    daClientItem.onNewDonationMessage(function(client, message){

        console.log('Donation from: ' + client.user_id);
        console.log(message);

    });

    daClientItem.connect();

});