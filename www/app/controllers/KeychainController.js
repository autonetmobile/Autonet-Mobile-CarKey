var KeychainController = {
  currentUnitID: undefined,
  keychainConnection : undefined,
  connectionFailureCount : 0,
  showingConfirmation : false,
  getStatusIfAwake : function() {
    var unit = Unit.findByUnitID(KeychainController.currentUnitID);
    if (KeychainController.keychainConnection && unit.attr("update")) {
      var status = KeychainController.keychainConnection.unitStatus;
      if (status == "online" || status == "offline_waiting") {
        KeychainController.execute("get status");
      }
    }
  },
  selectUnit : function() {
    $('#select-unit').die(); // unbind any old .live calls, as otherwise, pageshow will get called once for each time this line has been executed.
    $('#select-unit').live('pagecreate', function() {
      var units = Unit.controlledUnits();
  
      content = "<ul data-role=\"listview\" data-theme=\"g\">";
      for (i=0;i<units.length;i++) {   
        var unit = units[i];
         content += "<li><a href='#' onclick='KeychainController.currentUnitID = \"" + unit.attr('unitID') + "\"; KeychainController.showKeychain();'>" + unit.getDisplayName(); + "</a></li>"
      }
      content += "</ul>"
      $("#rows").replaceWith($(content));
    });
    AutonetApplication.loadPage("app/views/keychain/select_unit.html");
  },
  restoreLastUnit : function() {
    // This function is in charge of recalling what the last controlled unit was, and restoring it.
    AutonetApplication.debugLog("Restore Last Unit");
    AutonetApplication.debugLog("last unit storage: '" + localStorage.lastUnitID + "'");
    var unit = Unit.findByUnitID(localStorage.lastUnitID);
    if (unit && unit.attr("controlled") == true) {
      KeychainController.currentUnitID = localStorage.lastUnitID;
    } else {
      KeychainController.currentUnitID = undefined;
    }
  },
  showKeychain : function(options) {
    AutonetApplication.debugLog("Current Unit: " + KeychainController.currentUnitID)
    KeychainController.restoreLastUnit();
    if (KeychainController.currentUnitID == undefined) {
      var unit = Unit.firstControlledUnit();
      if (unit) {
        AutonetApplication.debugLog("Setting current unit: " + unit)
        KeychainController.currentUnitID = unit.attr('unitID');
      } else {
        AutonetApplication.alert("No units are visible. Please update your settings.");
        SettingsController.showUnits();
        return;
      }
    }
    
    $('#keychain').die(); // unbind any old .live calls, as otherwise, pageshow will get called once for each time this line has been executed.
    $('#keychain').live('pageshow', function() {
      KeychainController.showKeychainForUnit(KeychainController.currentUnitID);
    });
    options = options || {};
    options.transition = options.transition || 'slideup';
    options.reverse = options.reverse || true;
    AutonetApplication.loadPage("app/views/keychain/index.html", options);
  },
  requestUnitPassword : function(unit, successCallback, cancelCallback) {
    AutonetApplication.debugLog("request unit password");
    var gotPassword = function (password) {
      if (password != null) {
        successCallback(password);
      } else {
        cancelCallback();
      }
    }
    AutonetApplication.passwordPrompt("Enter password for " + unit.getDisplayName(), gotPassword);
  },
  loadKeychain : function(unit, host) {
    var url = "https://" + host + "/api?theme_name=" + unit.attr('theme') + "&make=" + unit.attr('make') + "&model=" + unit.attr('model') + "&year=" + unit.attr('year');
    AutonetApplication.debugLog("Theme URL: " + url);
    $.mobile.loadingMessage = "Loading Keychain";
    $.mobile.showPageLoadingMsg();
    var request = $.ajax({
      url: url,
      dataType:'html',
      error: function(jqXHR, textStatus, errorThrown) {
        console.log("ERROR: " + textStatus + " Thrown: " + errorThrown);
        if (host === AutonetApplication.host) {
          KeychainController.loadKeychain(unit, AutonetApplication.host2);
        } else {
          $.mobile.hidePageLoadingMsg();
          if ("timeout" == textStatus) {
            AutonetApplication.alert("Timed out loading keychain.");
          } else {
            AutonetApplication.alert("Failed to load keychain.");
          }
          SettingsController.settings();
        }
      },
      success: function(data, textStatus, jqXHR){
        $.mobile.hidePageLoadingMsg();
        console.log("SUCCESS");
        // console.log("DATA: " + data);
        $('#keychain').html("");
        $('#keychain').html(KeychainController.modifiedResponseText(data, host));
        $('.content').css('background', ""); 
        // Bind buttons
        KeychainController.setupUnitSelector();
        KeychainController.applyBindings();
        KeychainController.openConnectionForUnit(unit);
      },
      complete: function(jqXHR, textStatus) {
        console.log("COMPLETE: " + textStatus);
      }
    });
    console.log("REQUEST SENT: " + request);
  },
  showKeychainForUnit : function(unitID) {
    var unit = Unit.findByUnitID(unitID);
    if (!unit) {
      unit = Unit.first();
    }
    
    KeychainController.loadKeychain(unit, AutonetApplication.host);
    
    // Close any lingering connections
    if (KeychainController.keychainConnection) {
      KeychainController.keychainConnection.close();
      KeychainController.keychainConnection = undefined;
    }
    
    // Open new connection for unit.
    KeychainController.currentUnitID = unitID;
    localStorage.setItem("lastUnitID", unitID);
  },
  openConnectionForUnit : function(unit, connectionCommand, ignorePassword) {
    var unitPassword = unit.attr('password');
    
    if (!unitPassword || ignorePassword) {
      KeychainController.requestUnitPassword(unit,
        function(password) {
          // set password for unit so we can continue to use it this session.
          // do not save the unit.
          unit.attr("password", password);
          KeychainController.showKeychainForUnitWithPassword(unit.attr('unitID'), password, connectionCommand);
        },
        function() {
          // Failure
          // AutonetApplication.alert("No Password");
        }
      );
    } else {
      KeychainController.showKeychainForUnitWithPassword(unit.attr('unitID'), unitPassword, connectionCommand);
    }
  },
  showKeychainForUnitWithPassword : function(unitID, unitPassword, connectionCommand) {
    KeychainController.openConnectionForUnitWithPassword(unitID, unitPassword, connectionCommand);
  },
  openConnectionForUnitWithPassword : function(unitID, unitPassword, command, retries) {
    var connectionCommand = command;
    var retryCount;
    retryCount = retries || 0;
    AutonetApplication.debugLog("***Command to execute once connection is open: " + command);
    KeychainController.keychainConnection = AutonetApplication.openConnectionForUnit(unitID, unitPassword, UserCredentials.first(),
      function(failureMessage) {
        if (retries < 10) {
          setTimeout(function() {
            KeychainController.openConnectionForUnit(unitID, unitPassword, command, retryCount+1);
          }, 1000);
          return;
        }
        if (failureMessage === "CarKey app not enabled") {
          AutonetApplication.alert(failureMessage);
          KeychainController.showSettings();
          return;
        }
        var lastCommand = KeychainController.lastSentCommand || connectionCommand;
        KeychainController.lastSentCommand = undefined; // Clear last sent comma// nd so we don't sit around waiting.
        AutonetApplication.debugLog("KeychainController.openConnectionForUnitWithPassword Failure Callback");
        //         AutonetApplication.debugLog("Connection: " + KeychainController.keychainConnection);
        //         AutonetApplication.debugLog("Status: " + KeychainController.keychainConnection.readyState);
        //         AutonetApplication.debugLog("Failure Message: '" + failureMessage + "'");
        console.log("Last Command: " + lastCommand);
        // Failure Callback
        if (failureMessage == "" || failureMessage == undefined) {
          console.log("No Failure Message, returning.");
          return; // ignore if we have no failure message.
          // If this is our first connection failure, we should retry once.
          // failureMessage = AutonetApplication.connectionFailedMessage;
        }
        if (failureMessage === AutonetApplication.invalidPasswordResponse) {
          failureMessage = AutonetApplication.invalidPasswordMessage;
        }
        // if (failureMessage == AutonetApplication.connectionFailedMessage && 
        //     KeychainController.connectionFailureCount == 0) {
        //    AutonetApplication.debugLog("Connection failure, reopening connection, sending command: " + lastCommand);
        //    KeychainController.openConnectionForUnit(Unit.findByUnitID(unitID), lastCommand, false);
        // } else {
          if (KeychainController.showingConfirmation) {
            return;
          }   
          KeychainController.showingConfirmation = true;
          AutonetApplication.confirm(failureMessage,
            function() {
              KeychainController.showingConfirmation = false;
              // Retry
              console.log("RETRY: FAILURE MESSAGE: ", failureMessage);
              if (KeychainController.keychainConnection) {
                KeychainController.keychainConnection.close();
              }
              if (failureMessage === AutonetApplication.invalidPasswordMessage) {
                KeychainController.openConnectionForUnit(Unit.findByUnitID(unitID), lastCommand, true);
              } else {
                KeychainController.openConnectionForUnit(Unit.findByUnitID(unitID), lastCommand, false);
              }
            },
            function() {
              KeychainController.showingConfirmation = false;
              // No, do nothing. 
              // TODO: despose of KeychainController.keychainConnection?
              AutonetApplication.debugLog("Canceling: connection: " + KeychainController.keychainConnection);
            },"Retry", "Cancel"
          );
        // }
      },
      function() {
        // Success Callback
        KeychainController.connectionFailureCount = 0;
        KeychainController.keychainConnection.messageReceivedCallback = KeychainController.messageReceived;
        KeychainController.getStatusIfAwake();
        if (connectionCommand) {
          AutonetApplication.debugLog("***Executing command now that connection is open: " + connectionCommand);
          KeychainController.execute(connectionCommand);
          connectionCommand = undefined;
        }
      },
      function(connection) {
        // update connection
        KeychainController.keychainConnection = connection;
      }
    );
  },
  execute : function(command) {
    console.log("execute command: " + command);
    var executeCommand = function() {
      AutonetApplication.debugLog("Execute: " + command);
      // if (KeychainController.lastSentCommand == command) {
      //   AutonetApplication.debugLog("Not Executing, last command has not returned");
      //   return;
      // }
      if (!!KeychainController.keychainConnection) {
        KeychainController.lastSentCommand = command;
        KeychainController.keychainConnection.send(command);
      } else {
        KeychainController.openConnectionForUnit(Unit.findByUnitID(KeychainController.currentUnitID), command);
      }
    }
    if (AutonetApplication.commandConfirmations[command]) {
      // confirm
      AutonetApplication.confirm(AutonetApplication.commandConfirmations[command], executeCommand);
    } else {
      executeCommand();
    }
  },
  setupUnitSelector : function() {
    options = "";
    $(Unit.controlledUnits()).each(function() {
      unit = this
      options += "<option " + (unit.attr('unitID') == KeychainController.currentUnitID ? 'selected=\'selected\'' : '') + " value='" + unit.attr('unitID') + "'>" + unit.getDisplayName() + "</option>";
    });
    $("#vehicle-picker").html(options);
  },
  modifiedResponseText : function(responseText, host) {
    if (host === AutonetApplication.host2) {
      // Replace occurrences of AutonetApplication.host with AutonetApplication.host2
      responseText = responseText.replace(AutonetApplication.host, AutonetApplication.host2);
    }
    var text = responseText.replace(/\<UNIT_ID\>/gi, KeychainController.currentUnitID);
    text = text.replace(/\%3CUNIT_ID\%3E/gi, KeychainController.currentUnitID);
    text = text.replace(/\&lt\;UNIT_ID\&gt\;/gi, KeychainController.currentUnitID);
    return text;
  },
  applyBindings : function() {
    $("#settings").bind('click', function() { KeychainController.showSettings(); });
    $("#lock").bind('click', function() { KeychainController.execute("locks lock") });
    $("#unlock_driver").bind('click', function() { KeychainController.execute("locks unlock_driver") });
    $("#unlock_all").bind('click', function() { KeychainController.execute("locks unlock") });
    $("#engine_stop").bind('click', function() { KeychainController.execute("engine off") });
    $("#engine_start").bind('click', function() { KeychainController.execute("engine start") });
    $("#open_trunk").bind('click', function() { KeychainController.execute("trunk open") });
    $("#close_trunk").bind('click', function() { KeychainController.execute("trunk close") });
    $("#left_door_open").bind('click', function() { KeychainController.execute("leftdoor open") });
    $("#left_door_close").bind('click', function() { KeychainController.execute("leftdoor close") });
    $("#right_door_open").bind('click', function() { KeychainController.execute("rightdoor open") });
    $("#right_door_close").bind('click', function() { KeychainController.execute("rightdoor close") });
    $("#panic_off").bind('click', function() { KeychainController.execute("panic off") });
    $("#panic_on").bind('click', function() { KeychainController.execute("panic on") });
    $("#get_location").bind('click', function() { KeychainController.execute("get position") });
    $("#refresh").bind('click', function() { KeychainController.execute("get status") });
    
    $("#vehicle-picker").bind('change', function() {
      // Close any existing connections
      if (typeof(KeychainController.keychainConnection) !== "undefined") {
        KeychainController.keychainConnection.close();
      }
      // Hide any alert that is being shown.
      $.alerts._hide();
      
      var unitID = $("#vehicle-picker").val();
      $('#keychain').html("");
      if (AutonetApplication.splashImageUrl) {
        $('.content').css('background', "url(https://"+AutonetApplication.host + AutonetApplication.splashImageUrl + ")");
      } else {
        $('.content').css('background', "url(../" + AutonetApplication.splashScreenPath() + ")"); 
      }
      KeychainController.showKeychainForUnit(unitID);
    });
    var unit = Unit.findByUnitID(KeychainController.currentUnitID);
    var creds = UserCredentials.first();
    // NEVER EXECUTED!
    $("a.token").click(function(event) {
      var link = $(this);
      var href = link.attr('href');
      var openFunction = function(password) {
        var authString = "email="+creds.attr('email')+"&password="+password+"&auth=carkey";
        $.mobile.loadingMessage = "Authenticating";
        $.mobile.showPageLoadingMsg(); 
        $.post(AutonetApplication.getTokenURL,
               authString).success(function(data, textStatus, jqXHR) {
                 $.mobile.hidePageLoadingMsg(); 
                 $.mobile.loadingMessage = "Connecting";
                 var token = data;
                 if (href.match(/\?/) == null) {
                   href = href + "?token=" + token
                 } else {
                   href = href + "&token=" + token
                 }
                 AutonetApplication.openExternal(href);
               }).error(function() {
                 $.mobile.hidePageLoadingMsg();
                 $.mobile.loadingMessage = "Connecting";
                 console.log("An error occurred getting the token.");
                 AutonetApplication.alert("Authentication Failed");
               });
      };
      // Check authentication first.
      if (unit.attr("password")) {
        openFunction(unit.attr('password'))
      } else {
        KeychainController.requestUnitPassword(unit,
          function(password) {
            // set password for unit so we can continue to use it this session.
            // do not save the unit.
            unit.attr("password", password);
            openFunction(creds.attr('password'));
          },
          function() {
            // Failure, do nothing
          });
      }
      event.preventDefault();
      return false;
    });
  },
  showSettings : function() {
    if (KeychainController.showingConfirmation) {
      return;
    }
    console.log("Show Settings.");
    if (KeychainController.keychainConnection) {
      KeychainController.keychainConnection.errorReceivedCallback = undefined;
      KeychainController.keychainConnection.connectionFailureCallback = undefined;
      KeychainController.keychainConnection.messageReceivedCallback = undefined;
      KeychainController.keychainConnection.close();
    }
    $('#keychain').html("");
    if (AutonetApplication.splashImageUrl) {
      $('.content').css('background', "url(https://"+AutonetApplication.host + AutonetApplication.splashImageUrl + ")"); 
    } else {
      $('.content').css('background', "url(../" + AutonetApplication.splashScreenPath() + ")"); 
    }
    SettingsController.settings({transition: 'slideup'});
  },
  removeClassesFromButton : function(button) {
    button.removeClass("autonet-on");
    button.removeClass("autonet-off");
    button.removeClass("autonet-unknown");
  },
  messageReceived : function(message) {
    AutonetApplication.debugLog("KeychainController.messageReceived: " + message);
    if ("<<EOF>>" == message || "Command?" == message) {
      KeychainController.lastCompletedCommand = KeychainController.lastSentCommand;
      KeychainController.lastSentCommand = undefined;
      return; // nothing to do.
    }
    if ("Id?" == message) {
      alert("I thought authentication was happening elsewhere now");
      KeychainController.showKeychainForUnit(KeychainController.currentUnitID);
      return;
    }
    // we are going to ignore the "already " keyword and update the UI accordingly.
    // message = message.replace("already ", "");
    KeychainController.handleStateMessage(message);
  },
  handleStateMessage : function(message) {
    if (message.match("Invalid command")) {
      AutonetApplication.alert("This car does not know how to perform that operation.");
    } else if (message.match("trunk")) {
      AutonetApplication.debugLog("Setting trunk button state.");
      KeychainController.removeClassesFromButton($("#open_trunk"));
      if (message.match("opened")) {
        $("#open_trunk").addClass("autonet-on");
      } else if (message.match("closed")) {
        $("#open_trunk").addClass("autonet-off");
      } else {
        $("#open_trunk").addClass("autonet-unknown");
      }
    } else if (message.match("engine")) {
       KeychainController.removeClassesFromButton($("#engine_stop"));
       KeychainController.removeClassesFromButton($("#engine_start"));
       if (message.match("on")) {
          $("#engine_start").addClass("autonet-on");
          $("#engine_stop").addClass("autonet-off");
       } else if (message.match("off")) {
         $("#engine_start").addClass("autonet-off");
         $("#engine_stop").addClass("autonet-on");
       } else {
         $("#engine_start").addClass("autonet-unknown");
         $("#engine_stop").addClass("autonet-unknown");
       }
    } else if (message.match("locks")) {
       KeychainController.removeClassesFromButton($("#lock"));
       KeychainController.removeClassesFromButton($("#unlock_driver"));
       KeychainController.removeClassesFromButton($("#unlock_all"));
       if (message.match("driver_unlocked")) {
         $("#unlock_driver").addClass("autonet-on");
         $("#unlock_all").addClass("autonet-off");
         $("#lock").addClass("autonet-off");
       } else if (message.match("unlock")) {
         $("#unlock_driver").addClass("autonet-off");
         $("#unlock_all").addClass("autonet-on");
         $("#lock").addClass("autonet-off");
       } else if (message.match("lock")) {
         $("#unlock_driver").addClass("autonet-off");
         $("#unlock_all").addClass("autonet-off");
         $("#lock").addClass("autonet-on");
       } else {
         $("#unlock_driver").addClass("autonet-unknown");
         $("#unlock_all").addClass("autonet-unknown");
         $("#lock").addClass("autonet-unknown");
       }
    } else if (message.match("leftdoor")) {
      KeychainController.removeClassesFromButton($("#left_door_open"));
      KeychainController.removeClassesFromButton($("#left_door_close"));
      if (message.match("opened")) {
        $("#left_door_open").addClass("autonet-on");
        $("#left_door_close").addClass("autonet-off");
      } else if (message.match("closed")) {
        $("#left_door_open").addClass("autonet-off");
        $("#left_door_close").addClass("autonet-on");
      } else {
        $("#left_door_open").addClass("autonet-unknown");
        $("#left_door_close").addClass("autonet-unknown");
      }
    } else if (message.match("rightdoor")) {
      KeychainController.removeClassesFromButton($("#right_door_open"));
      KeychainController.removeClassesFromButton($("#right_door_close"));
      if (message.match("opened")) {
        $("#right_door_open").addClass("autonet-on");
        $("#right_door_close").addClass("autonet-off");
      } else if (message.match("closed")) {
        $("#right_door_open").addClass("autonet-off");
        $("#right_door_close").addClass("autonet-on");
      } else {
        $("#right_door_open").addClass("autonet-unknown");
        $("#right_door_close").addClass("autonet-unknown");
      }
    } else if (message.match("panic")) {
      KeychainController.removeClassesFromButton($("#panic_off"));
      KeychainController.removeClassesFromButton($("#panic_on"));
      if (message.match("on")) {
         $("#panic_on").addClass("autonet-on");
         $("#panic_off").addClass("autonet-off");
      } else if (message.match("off")) {
        $("#panic_on").addClass("autonet-off");
        $("#panic_off").addClass("autonet-on");
      } else {
        $("#panic_on").addClass("autonet-unknown");
        $("#panic_off").addClass("autonet-unknown");
      }
    }   else if (message.match("position ")) {
      message = message.replace("position ", "");
      var components = message.split(",")
      var cords = components[0];
      var parts = cords.split("/");
      var dateString = components[1];
      var latitude = parts[0];
      var longitude = parts[1];
      var dateLabel = "";
      if (dateString) {
        date = new Date(dateString);
        if (date) {
          dateLabel = " " + date.toLocaleTimeString() + " " + (date.getMonth() + 1) + "\/" + date.getDate() + "\/" + date.getFullYear();
        }
      }
      var name = Unit.findByUnitID(KeychainController.currentUnitID).getMapDisplayName() + dateLabel;
      AutonetApplication.mapLocation(latitude + ',' + longitude, name);
    } else if (message.match("Unit not online") || message.match("Car not online") || message.match("Car is not online")) {
      AutonetApplication.alert("Car is offline, sending a Wakeup. Will send an SMS message when the command completes.");
    } else {
      AutonetApplication.debugLog("UNKNOWN RESPONSE: " + message);
    }
  }
}