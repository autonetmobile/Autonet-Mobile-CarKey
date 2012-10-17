function AutonetConnection (unitID, unitPassword, userCredentials, failureCallback, successCallback, errorCallback) {
  this.currentHost = undefined;
  this.primaryHost = "wss://mia-tm-app-a.autonetmobile.net:4001", // + AutonetApplication.host + ":4001";
  this.primaryHostConnectionFailures = 0;
  this.secondaryHost = "wss://cjr-tm-app-a.autonetmobile.net:4002", // + AutonetApplication.host + ":4002";
  this.secondaryHostConnectionFailures = 0;
  this.maxAttemptsPerConnection = 2;
  this.connectionTimeoutInMilliseconds = 30000; // 5000;
  this.sentCommandCount = 0;
  
  this.userCredentials = userCredentials;
  this.password = unitPassword;
  this.unitID = unitID;
  this.unitStatus = "";
  this.connectionFailureCallback = failureCallback;
  this.messageReceivedCallback = successCallback;
  this.errorReceivedCallback = errorCallback;
  
  this.connectionIsOpen = false;
  this.isConnecting = false;
  this.isClosingConnection = false;
  this.websocket = undefined;
  this.connectionIsWaitingForAuthentication = false;
  this.connectionIsWaitingForCommand = false; 
  this.recievedMessage = false;
  
  AutonetApplication.connections.push(this);
  
  this.resetConnectionFailures = function() {
    this.primaryHostConnectionFailures = 0;
    this.secondaryHostConnectionFailures = 0;
  };
  
  this.connect = function() {
    this.sentCommandCount = 0;
    console.log("this.sentCommandCount = " + this.sentCommandCount + " - connect");
    $.mobile.showPageLoadingMsg(); 
    this.isConnecting = true;
    this.connectionIsOpen = false;
    this.unitStatus = "";
    AutonetApplication.debugLog("Trying To Open Connection");
    
    if (this.primaryHostConnectionFailures > 0) {
      $.mobile.loadingMessage = "Retrying";
    }
    $.mobile.showPageLoadingMsg();
    
    if (this.maxAttemptsPerConnection > this.primaryHostConnectionFailures) {
      AutonetApplication.debugLog("Using primary host. Primary Connection failures: " + this.primaryHostConnectionFailures);
      this.currentHost = this.primaryHost;
    } else if (this.maxAttemptsPerConnection > this.secondaryHostConnectionFailures) {
      AutonetApplication.debugLog("Using secondary host. Secondary Connection failures: " + this.secondaryHostConnectionFailures);
      this.currentHost = this.secondaryHost;
    } else {
      // CONNECTION FAILURE! 
      this.resetConnectionFailures();
      if (this.connectionFailureCallback) { 
        AutonetApplication.debugLog("Too Many Attempts! FAIL");
        this.connectionFailureCallback();
      } else {
        AutonetApplication.debugLog("Too Many Attempts! No Callback! FAIL!");
        // TODO: handle error here?
      }
      return;
    }
    AutonetApplication.debugLog("Creating new websocket to host: " + this.currentHost )
    try {
      this.websocket = new WebSocket(this.currentHost, "wss");
    } catch (e) {
      AutonetApplication.debugLog("Cannot create websocket! FAIL");
      this.connectionFailureCallback();
    }
    AutonetApplication.debugLog("Created Websocket");
    var connection = this; // Gives us a reference to use in our callbacks.
    this.websocket.onopen = function(evt) { connection.isConnecting = false; connection.connectionIsOpen = true; connection.onOpen(evt); };
    this.websocket.onclose = function(evt) { connection.isConnecting = false; connection.connectionIsOpen = false; connection.onClose(evt) };
    this.websocket.onmessage = function(evt) { connection.onMessage(evt) };
    this.websocket.onerror = function(evt) { connection.onError(evt) };
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
    }
    this.connectionTimeout = setTimeout(function(){
      AutonetApplication.debugLog("Timer Fired: " + connection.websocket);
      // AutonetApplication.debugLog("Ready State: " + connection.websocket.readyState);
      AutonetApplication.debugLog("Connection Open: " + connection.connectionIsOpen);

      connection.connectionTimeout = undefined;
      if (connection.connectionIsOpen == false && connection.websocket) {
        AutonetApplication.debugLog("TIMEOUT!");
        this.close();
        connection.onError({'data': "Connection Timed Out"});
      }
    },
    20000);
  };
  
  this.close = function() {
    if (this.websocket) {
      AutonetApplication.debugLog("Closing websocket.");
      this.isClosingConnection = true;
      this.websocket.close();
    } else {
      AutonetApplication.debugLog("WARNING: No Websocket To Close.");
    }
  };
  
  this.closeWithError = function() {
    AutonetApplication.debugLog("Calling Close With Error");
    
    // TODO: I'm not happy about these being here. Must be a better way.
    // KeychainController.lastSentCommand = undefined;
    // KeychainController.lastCompletedCommand = undefined;
    
    if (this.websocket) {
      var onClose = this.websocket.onclose;
      this.websocket.onclose = undefined;
      this.websocket.close();
      onClose({'data': 'force close'});
    }
  }
  
  this.timeoutTimer = undefined;
  this.loadingMessageForCommand = {
    "locks lock": "Lock All Command Sent",
    "locks unlock_driver": "Unlock Driver Command Sent",
    "locks unlock": "Unlock All Command Sent",
    "engine off": "Engine Stop Command Sent",
    "engine start": "Engine Start Command Sent",
    "trunk open": "Open Trunk Command Sent",
    "leftdoor open": "Open Left Door Command Sent",
    "leftdoor close": "Close Left Door Command Sent",
    "rightdoor open": "Open Right Door Command Sent",
    "rightdoor close": "Close Right Door Command Sent",
    "panic off": "Horn and Lights Off Command Sent",
    "panic on": "Horn and Lights Command Sent",
    "get position": "Getting Vehicle Position",
    "get status": "Getting Current Status",
  };
  this.send = function(message) {
    // Before sending message, we are going to check the connection status. If we are not connected, throw an error.
    // if we are connected, set a timeout.
    if (navigator.network && navigator.network.connection.type == Connection.NONE) {
      console.log("No Network, calling closeWithError");
      this.closeWithError();
      return;
    }
    var timeoutLength = 90000;
    // if (navigator.network && (navigator.network.connection.type == Connection.CELL_2G ||
    //                              navigator.network.connection.type == Connection.CELL_3G)) {
    //       timeoutLength = 40000;
    // }
    // if (this.unitStatus == "offline_waiting") {
    //   timeoutLength = 60000;
    // } 
    AutonetApplication.debugLog("Sending: " + message + " Unit Status: " + this.unitStatus);
    if (this.websocket) {
      this.sentCommandCount++;
      console.log("this.sentCommandCount = " + this.sentCommandCount);
      $.mobile.loadingMessage = this.loadingMessageForCommand[message] || "Sending";
      $.mobile.showPageLoadingMsg();
      this.websocket.send(message);
    } else {
      this.connect();
    }
    
    var aConnection = this;
    if (undefined == this.timeoutTimer) { // Only start the timer if we don't already have one running.
      this.timeoutTimer = setTimeout(function() {
        console.log("Timeout, calling close with error.");
        aConnection.closeWithError();
      }, timeoutLength);
    }
  };
  this.invalidateTimeoutTimer = function() {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = undefined;
    } 
  }
  
  this.onError = function(evt) {
    this.sentCommandCount = 0;
    console.log("this.sentCommandCount = 0 - onError")
    $.mobile.hidePageLoadingMsg(); 
    $.mobile.loadingMessage = "Connecting";
    AutonetApplication.debugLog("Error: " + evt.data);
    if ("" == evt.data) {
      evt.data = "Failed to connect";
    }
    // /[^\s]+/.test(evt.data) tests the string and returns true only if it is not blank. (not "", not " ", etc.)
    if (this.errorReceivedCallback && evt.data && /[^\s]+/.test(evt.data)) {
      this.errorReceivedCallback(evt.data);
    }
    
    AutonetApplication.debugLog("Closing Socket: " + this.websocket);
    if (!/[^\s]+/.test(evt.data)) {
      if (!this.recievedMessage) {
        return;
      }
      if (this.errorReceivedCallback) {
        this.errorReceivedCallback(undefined);
      }
      this.closeWithError();
    } else {
      console.log("Error, calling close with error");
      this.closeWithError();
    }
  };
  
  this.onClose = function(evt) {
    if (this.sentCommandCount == 0)
    this.sentCommandCount = 0;
    console.log("this.sentCommandCount = 0 - onClose");
    $.mobile.hidePageLoadingMsg(); 
    $.mobile.loadingMessage = "Connecting";
    if (this.websocket) {
      this.websocket = undefined;
      this.connectionIsOpen = false;
      this.connectionIsWaitingForAuthentication = false;
      this.connectionIsWaitingForCommand = false;
      if (!this.isClosingConnection) {
        AutonetApplication.debugLog("Connection closed unnexpectidly. failure.");
        // unintentional close.
        if (this.currentHost == this.primaryHost) {
          this.primaryHostConnectionFailures++;
        } else {
          this.secondaryHostConnectionFailures++;
        }
        if (this.secondaryHostConnectionFailures < this.maxAttemptsPerConnection) {
          var connection = this;
          setTimeout(function() {
            connection.connect();
          }, 1000 * 2);
        } else {
          AutonetApplication.debugLog("CONNECTION FAILURE!")
          if (this.connectionFailureCallback) {
            this.connectionFailureCallback();
          }
        }
      } else {
        AutonetApplication.debugLog("Closing Connection Intentionally.")
        this.close();
      }
    } else {
      AutonetApplication.debugLog("No Websocket!");
    }
    this.isClosingConnection = false;
  };
  
  this.onOpen = function(evt) {
    AutonetApplication.debugLog("open");
    // start timer.
    var connection = this;
    this.recievedMessage = false;
    setTimeout(function() {
      connection.checkTimeout();
    },
    4000);
  };
  this.checkTimeout = function() {
    if (false == this.recievedMessage) { // note: we were checking ready state here, but this did not work on android :(
      // Timeout!
      AutonetApplication.debugLog("No Message Received! Connection Timeout! Closing connection. ")       
      this.closeWithError();
    } else {
      this.resetConnectionFailures();
    }
  };
  
  this.callMessageRecievedCallback = function(message) {
    if (this.messageReceivedCallback) {
      this.messageReceivedCallback(message);
    }
  };
  this.callErrorRecievedCallback = function(error) {
    console.log("Calling errorReceivedCallback: " + this.errorReceivedCallback + " error: " + error);
    if (this.errorReceivedCallback) {
      this.errorReceivedCallback(error);
    }
  };
  
  this.onMessage = function(evt) {
    this.invalidateTimeoutTimer();
    this.recievedMessage = true;    
    AutonetApplication.debugLog("Message: " + evt.data);
    var message = decodeURIComponent(evt.data).replace(/\n/, ""); // unencode if neccesary, strip newline
    AutonetApplication.debugLog("Decoded and stripped Message: " + message);
    
    this.connectionIsWaitingForAuthentication = false;
    this.connectionIsWaitingForCommand = false;
    
    if (message == "Id?") {
      this.connectionIsWaitingForAuthentication = true;
      this.send(this.unitID + "," + this.userCredentials.attr('email') + "," + this.password + "," + this.userCredentials.attr('phoneNumber') + "@" + this.userCredentials.attr('providerServer') + "," + AutonetApplication.appType);
      return;
    } else if (message.match(this.unitID)) {
      var status = message.split(":")[1];
      AutonetApplication.debugLog("MATCHES UNIT ID! STATUS: " + status);
      this.unitStatus = status;
      return;
    }
    if (message == "Command?") {
      this.sentCommandCount--;
      console.log("this.sentCommandCount = " + this.sentCommandCount + " Command?");
      // save credentials.
      this.userCredentials.save(); // TODO: figure out how to only save this the first time? maybe we could check "userCredentials.changes?"
      
      this.connectionIsWaitingForCommand = true;
      this.callMessageRecievedCallback(message);
    } else if (message.match(/<<Error: .*>>/)) {
      // Websocket will also be closed shortly?
      var error = message.replace(/<<Error: (.*)>>/, "$1");
      AutonetApplication.debugLog("Error message recieved: " + error);
      this.isClosingConnection = true;
      this.callErrorRecievedCallback(error);
    } else if (message == "Invalid device or action") {
      this.callErrorRecievedCallback(message);
    } else if ((message.match(/Error: .*/))) {
      var error = message.replace(/Error: (.*)/, "$1");
      AutonetApplication.alert(error); // This is a user error.
    } else if ((message.match(/Alert: .*/))) {
      var error = message.replace(/Alert: (.*)/, "$1");
      AutonetApplication.alert(error); // This is a user alert.
    } else if (message.match(/<<Failed: .*>>/)) {
      var error = message.replace(/<<Failed: (.*)>>/, "$1");
      AutonetApplication.debugLog("Failure message recieved: " + error);
      this.callErrorRecievedCallback(error);
    } else {
      this.callMessageRecievedCallback(message);
    }
    if (this.sentCommandCount == 0) {
      $.mobile.hidePageLoadingMsg();
      $.mobile.loadingMessage = "Connecting";
    }
  };
}