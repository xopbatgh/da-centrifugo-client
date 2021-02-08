const WebSocket = require('ws');
const axios = require('axios');

class DaClient {

    user_id = undefined;
    socket_connection_token = undefined;
    access_token = undefined;

    socket = undefined;

    debug = true;

    connection = {
        uuid4: undefined, // centrifugo userid
        channel: {
            channel: undefined,
            token: undefined,
        },
        has_error: false,
        errors: [],
    };

    callbacks = {
        onConnected: function(){},
        onFailed: function(){},
        onNewMessage: function(){},
        onNewDonationMessage: function(){},
    };

    messages = [];

    endpoint = 'wss://centrifugo.donationalerts.com/connection/websocket';

    constructor(user_id, socket_connection_token, access_token) {

        this.user_id = user_id;
        this.access_token = access_token;
        this.socket_connection_token = socket_connection_token;

    }

    onConnected(callback) {

        this.callbacks.onConnected = callback;

    }

    onFailed(callback) {

        this.callbacks.onFailed = callback;

    }

    onNewDonationMessage(callback) {

        this.callbacks.onNewDonationMessage = callback;

    }

    onNewMessage(callback) {

        this.callbacks.onNewMessage = callback;

    }

    connect(){

        var component = this;

        component.socket = new WebSocket(component.endpoint, {perMessageDeflate: false});
        component.socket.on('open', function() {

            component.authChannel();

        });


        component.socket.on('message', function(data, flags) {

            var data_json = JSON.parse(data);

            component.handleCentrifugoMessage(data_json);

        });

    }

    handleCentrifugoMessage(data){

        var component = this ;

        component.event_onMessage(data);

        var message_type = component.getMessageType(data);

        if (message_type == 'registered_centrifugo'){
            var uuid4 = data.result.client;

            component.setUuid4(uuid4);
            component.subscribeChannel();

        }

        if (message_type == 'subscripted_centrifugo')
            component.event_onConnected();

        if (message_type == 'new_donation')
            component.event_onDonation(data);

        if (this.debug)
            console.log(component.getMessageType(data));

    }

    authChannel(){

        this.socket.send(JSON.stringify({
            "params": {
                "token": this.socket_connection_token,
            },
            "id": 1
        }));

    }

    subscribeChannel(){

        var component = this ;

        if (component.connection.uuid4 == undefined)
            return 'unable to subcribe: no uuid4 is found';

        var subscriptionArgs = {
            channels: ["$alerts:donation_" + component.user_id],
            client: component.connection.uuid4,
        };

        axios
            .post('https://www.donationalerts.com/api/v1/centrifuge/subscribe', subscriptionArgs, {
                headers: {
                    'Authorization': 'Bearer ' + component.access_token,
                    'Content-Type': 'application/json',
                },
            })
            .then(function(res) {

                if (res.data.hasOwnProperty('channels') && res.data.channels.length > 0){

                    var channel = res.data.channels[0];

                    component.connection.channel = channel;

                    // open channel connection
                    component.socket.send(JSON.stringify({
                        "params": {
                            "channel": channel.channel,
                            "token": channel.token
                        },
                        "method": 1,
                        "id": 2
                    }));


                }
                else {

                    component.setError({
                        error: 'unable to subscribe',
                        data: res.data,
                    });

                }



            })
            .catch(function(error) {

                component.setError(error);

            });
    }

    dumpVariables(){

        var result = '';

        result += 'uuid4: ' + this.connection.uuid4 + '<br/>';
        result += 'connection_token: ' + this.socket_connection_token + '<br/>';
        result += 'errors: ' + JSON.stringify(this.connection.errors) + '<br/>';
        result += 'channel: ' + JSON.stringify(this.connection.channel) + '<br/>';

        result += 'messages: ' + JSON.stringify(this.messages) + '<br/>';

        return result;
    }

    setError(error_object){

        this.connection.has_error = true;
        this.connection.errors.push(error_object);

        this.event_onFailed();

    }

    setUuid4(uuid4){

        this.connection.uuid4 = uuid4;

    }

    getMessageType(data){

        if (data.hasOwnProperty('result') && data.result.hasOwnProperty('client'))
            return 'registered_centrifugo';

        if (data.hasOwnProperty('result') && data.result.hasOwnProperty('type') && data.result.type == 1)
            return 'subscripted_centrifugo';

        if (data.hasOwnProperty('result') && data.result.hasOwnProperty('data') && data.result.data.data.hasOwnProperty('amount_in_user_currency'))
            return 'new_donation';

        return 'undefined msg type';

    }

    isConnected(){

        if (this.connection.channel.token == undefined)
            return false;

        if (this.connection.has_error)
            return false;

        return true;

    }

    event_onMessage(message){

        this.messages.push(message);

        this.callbacks.onNewMessage(this, message);

    }

    event_onDonation(message){

        this.callbacks.onNewDonationMessage(this, message);

    }

    event_onConnected(){

        this.callbacks.onConnected(this);

    }

    event_onFailed(){

        this.callbacks.onFailed(this);

    }

}

exports.DaClient = DaClient;