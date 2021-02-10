# da-centrifugo-client
Is a event-based nodejs client for Centrifugo Donation Alerts API

See the full example at /da-centrifugo-client/example.js

#### Step 1. Init ####
```PHP

var daClientItem = new DaClient(da_user_id, socket_connection_token, access_token);
```

#### Step 2. Setup events ####


Available events: 

#####— onConnected (daClientItem)
is fired on connection successful and ready to receive messages

#####— onFailed (daClientItem)
is fired on connection failed and client is not ready and never become so

#####— onNewMessage (daClientItem, message)
on any new message from DA Centrifugo received

#####— onNewDonationMessage (daClientItem, message)
on donation message received only

Example:

```PHP

daClientItem.onConnected(function(client){

    console.log('Success: ' + client.user_id);

});

```

Feel free to contribute