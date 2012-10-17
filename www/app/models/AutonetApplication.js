// Application instance. Singleton.
var AutonetApplication = {
  appType: "Autonet",
  currentVersion: "1.1", // This is used to determine if the EULA is presented or not.
  debug: true,
  host: "mia-tm-app-a.autonetmobile.net:7443", // "staging.twotoasters.com", // "tru-app-dev.autonetmobile.net", //
  host2: "cjr-tm-app-a.autonetmobile.net:7443",
  alertTitle: "Autonet Message",
  logoutConfirmationMessage: "Are you sure?",
  connectionFailedMessage: "Failed to connect",
  httpErrorMessage: "Unable to connect to server. Retry?",
  invalidPasswordResponse: "Invalid Id",
  invalidPasswordMessage: "Invalid Email or Remote PIN, please try again",
  settingsSavedMessage: "Settings Saved",
  createAccountURL: "https://my.autonetmobile.net:8443/users/registration",
  getTokenURL: "https://my.moparconnect.net:8443/auth/",
  applicationPaused: false,
  onResumeFunction: undefined,
  displayCreateAccount: true,
  
  message: undefined,
  splashImageUrl: undefined,
  stylesheetUrl: undefined,
  stylesheetContent: "",
  commandConfirmations: {},
  
  userCredentials : undefined,
  units: undefined,
  connection : undefined,
  
  pageHistory : [],
  currentPage : "",
  
  connections : [],
  
  exit : function() {
    for (i=0;i<this.connections.length;i++) {
      this.connections[i].close();
    }
    this.connections = [];
    window.location = this.basePath() + "app/views/index/index.html";
    // PhoneGap.exec(undefined,    //Success callback from the plugin
    //                      undefined,     //Error callback from the plugin
    //                      'com.twotoasters.temporaryalert',  //Tell PhoneGap to run "DirectoryListingPlugin" Plugin
    //                      'exit',              //Tell plugin, which action we want to perform
    //                      []);                                     
    // PhoneGap.exec(null, null, "App", "exitApp", []);              
  },
  
  splashScreenPath : function (){
    var dpi = 'mdpi';
    var longNotLong = 'notlong';
    console.log("Splash Screen Path");
    if (0.75 >= window.devicePixelRatio) {
      console.log("ldpi");
      dpi = 'ldpi';
    } else if (1.5 <= window.devicePixelRatio) {
      console.log("hdpi");
      dpi = 'hdpi';
    }
    if (window.innerWidth / window.innerHeight > 10 / 15) {
      console.log("long");
      longNotLong = 'long';
    }
    var folder = "drawable-" + longNotLong + "-" + dpi;
    return "/assets/" + folder + "/splash.png";
    // $('.content').css('background', "url(../assets/splash.png)"); 
  },
  
  hideSplashScreen : function() {
    $('.content').css('background', "");
  },
  
  openExternal : function(url){ 
    var link = $('<a target="_blank"></a>')[0]; 
    link.href = url; 
    var clickevent = document.createEvent("UIEvents"); 
    clickevent.initEvent('click', true, true); 
    link.dispatchEvent(clickevent); 
  },
  
  getUserCredentials : function() {
    if (undefined == self.userCredentials) {
      self.userCredentials = UserCredentials.first();
    }
    return self.userCredentials;
  },
  
  stylesheetTagText : function() {
    return "<style>"+AutonetApplication.stylesheetContent+"</style>"
  },
  
  backButtonWasPressed : function() {
    if ($('iframe#external').css('display') == 'block') {
      $('iframe#external').hide();
      return;
    }
    console.log("Back Button Pressed");
    AutonetApplication.debugLog("*****Current Page" + AutonetApplication.currentPage);
    var arrayOfAcceptablePaths = ["app/views/settings/show_units.html",
                                  "app/views/settings/show.html",
                                  "app/views/settings/account.html"];
    if (arrayOfAcceptablePaths.indexOf(AutonetApplication.currentPage) != -1) {
      var previousPage = AutonetApplication.pageHistory.pop();
      AutonetApplication.debugLog("Previous Page: " + previousPage);
      AutonetApplication.loadPage(previousPage, {reverse: true}, true);
    } else {
      AutonetApplication.exit();
    }
  },
  
  passwordPrompt : function(message, callback) {
    AutonetApplication.debugLog("Password Prompt");
    $.alerts.okButton = "OK";
    $.alerts.cancelButton = "Cancel";
    jPrompt(message, "", "AutonetMobile", callback); 
  },
  
  parseAppJSONResponse : function(json) {
    var response = JSON.parse(json);
    if (response.alert_message && response.alert_message.length > 0) {
      this.message = response.alert_message;
      // Showing the message has been moved to after the user logs in.
    }
    if (response.splash_screen_image_url) {
      // Disable the splash image URL.
      // this.splashImageUrl = response.splash_screen_image_url;
    }
    if (response.stylesheet_url) {
      this.stylesheetUrl = response.stylesheet_url;
    }
    if (response.command_confirmations) {
      this.commandConfirmations = response.command_confirmations;
    }
  },
  
  mapLocation : function(coordinates, name){
    AutonetApplication.debugLog("Opening Map : " + coordinates);
    // why is there no 'device' on android?
    if (typeof(device) != "undefined" && (device.platform == "iPhone" || device.platform == "iPad")) {
      window.location = "maps:q=" + encodeURIComponent(coordinates);
    } else {
      var url = "geo:" + "0,0" + "?q=" + encodeURIComponent(coordinates + "(" + name + ")");
      window.location = url;
    }
  },
  
  basePath : function() {
    var location = $.mobile.activePage[0].baseURI; // window.location.pathname
    AutonetApplication.debugLog("Full Path: " + location);
    var path = ""
    var parts = location.split("/");
    var indexOfWWW = parts.indexOf("www");
    for (i = indexOfWWW; i < parts.length - 2; i++) {
      path = path + "../"
    }
    return path;
  },
  
  loadPage : function(path, options, skipHistoryTracking) {
    if (!skipHistoryTracking) {
      var index = AutonetApplication.pageHistory.indexOf(path);
      AutonetApplication.debugLog("INDEX OF: " + index);
      if (index >= 0) {
        AutonetApplication.pageHistory.splice(AutonetApplication.pageHistory.indexOf(path), 1);
      }
      AutonetApplication.pageHistory.push(AutonetApplication.currentPage);
      AutonetApplication.debugLog("***Page history: " + AutonetApplication.pageHistory.join(", "));
    }
    AutonetApplication.currentPage = path;
    AutonetApplication.debugLog("*****Set Current Page: " + AutonetApplication.currentPage);
    var base = this.basePath();
    AutonetApplication.debugLog("full path: " + base + path);
    $.mobile.changePage(base + path, options);
  },
  
  alert : function(message, callback) {
    $.alerts.okButton = "OK";
    jAlert(message, "AutonetMobile", callback);
  },
  alertWithCustomButton : function(message, callback, buttonName) {
    $.alerts.okButton = buttonName;
    jAlert(message, "AutonetMobile", callback);
  },
  alertOnce : function(messageKey, message, callback, dontClearOnLogout) {
    AutonetApplication.debugLog("Alert once. Key: " + messageKey);
    var keys = JSON.parse(localStorage.getItem("AlertOnceKeys") || "[]");
    var persistantKeys = JSON.parse(localStorage.getItem("AlertOnceEverKeys") || "[]");
    keys = keys || [];
    persistantKeys = persistantKeys || []
    if (-1 == keys.indexOf(messageKey) &&
        -1 == persistantKeys.indexOf(messageKey)) {
      AutonetApplication.debugLog("Showing one time alert");
      AutonetApplication.debugLog("Setting shown for key: " + messageKey);
      if (dontClearOnLogout) {
        persistantKeys.push(messageKey);
        localStorage.setItem("AlertOnceEverKeys", JSON.stringify(persistantKeys));
      } else {
        keys.push(messageKey);
        localStorage.setItem("AlertOnceKeys", JSON.stringify(keys));
      }
      $.alerts.okButton = "OK";
      jAlert(message, "AutonetMobile", callback);
    }
  },
  temporaryAlert : function(message) {
    if (navigator.temporaryalert) {
      navigator.temporaryalert.show(message);
    } else {
      this.alert(message);
    }                    
  },
  confirm : function(message, successCallback, optionalFailureCallback, affirmativeButtonTitle, negativeButtonTitle) {
    affirmativeButtonTitle = affirmativeButtonTitle || "Yes";
    negativeButtonTitle = negativeButtonTitle || "No";
    var buttonTitles = negativeButtonTitle + "," + affirmativeButtonTitle;
    console.log("Button Titles: " + buttonTitles);
    // NOTE: On android, the native confirm sometimes does not call a callback. this is terrible. Use JS confirm
    $.alerts.okButton = affirmativeButtonTitle;
    $.alerts.cancelButton = negativeButtonTitle;
    var callback = (function(result) {
      console.log("Confirmation Button Clicked: " + result);
      if (result) {
        successCallback();
      } else {
        if (optionalFailureCallback) {
          optionalFailureCallback();
        }
      }
    });
    jConfirm(message, "AutonetMobile", callback);
  },
  
  nativeConfirm: function(message, successCallback, optionalFailureCallback, affirmativeButtonTitle, negativeButtonTitle) {
    affirmativeButtonTitle = affirmativeButtonTitle || "Yes";
    negativeButtonTitle = negativeButtonTitle || "No";
    var buttonTitles = negativeButtonTitle + "," + affirmativeButtonTitle;
    if (navigator.notification) {
      console.log("Showing native confirmation")
      // note that the indexes don't start at 0, they start at one. BAHHHH!!!!
      var callback = (function(index) {
        console.log("Confirmation Button Clicked: " + index);
        if (index == 2) {
          successCallback();
        } else {
          if (optionalFailureCallback) {
            optionalFailureCallback();
          }
        }
      });
      navigator.notification.confirm(message, callback, AutonetApplication.alertTitle, buttonTitles);
    } else {
      console.log("Showing JS confirmation");
      var result = confirm(message);
      console.log("Confirmation Result: " + result)
      if (result) {
        AutonetApplication.debugLog("Calling confirm callback");
        successCallback();
      } else if (optionalFailureCallback){
        AutonetApplication.debugLog("Calling deny callback");
        if (optionalFailureCallback) {
          optionalFailureCallback();
        }
      }
    }
  },
  
  debugLog : function(message) {
    if (AutonetApplication.debug) {
      console.log(message)
    }
  },
  loadAppType : function(host, callback, retries) {
    $.mobile.loadingMessage = "Loading";
    $.mobile.showPageLoadingMsg();
    var failureMessage = "This application requires an Internet connection to continue.";
    var retryCount;
    retryCount = retries || 0;
    retry = function() {
      if (retryCount < 5) {
        setTimeout(function() {
          AutonetApplication.loadAppType(host, callback, retryCount + 1);
        }, 1000);
      } else if (host === AutonetApplication.host) {
        setTimeout(function() {
          AutonetApplication.loadAppType(AutonetApplication.host2, callback);
        }, 1000);
      } else {
        return false;
      }
      return true;
    }
    var request = $.ajax({
      url: "https://" + host + "/applications/" + AutonetApplication.appType + ".json",
      dataType: 'html',
      error: function() {
        $.mobile.hidePageLoadingMsg();
        if (!retry()) {
          AutonetApplication.debugLog("Unable to load theming information for app " + AutonetApplication.appType);
          AutonetApplication.alertWithCustomButton(failureMessage, function() {
             AutonetApplication.loadAppType(AutonetApplication.host, callback);
           }, "Retry");
        }
      },
      success: function(data, textStatus, jqXHR) {
        AutonetApplication.debugLog("Loaded theming info: " + data);
        AutonetApplication.parseAppJSONResponse(data);
        if (AutonetApplication.stylesheetUrl) {
          var jqhxr = $.ajax({url: AutonetApplication.stylesheetUrl,
           success: function(data) {
             $.mobile.hidePageLoadingMsg();
             AutonetApplication.stylesheetContent = data;
             callback();
           },
           error: function() {
             $.mobile.hidePageLoadingMsg();
             if (!retry()) {
               $.alerts.okButton = "Retry";
               AutonetApplication.alertWithCustomButton(failureMessage, function() {
                 AutonetApplication.loadAppType(AutonetApplication.host, callback);
               }, "Retry")
             }
           }});
        } else {
          $.mobile.hidePageLoadingMsg();
          callback();
        }
      }
    });
  },
  resume : function() {
    if (!KeychainController.keychainConnection) {
      AutonetApplication.loadAppType(AutonetApplication.host, function(){ console.log("Reloaded App Type") });
    }
    KeychainController.getStatusIfAwake();
  },
  presentEULA : function(success) {
    var versionString = localStorage["LastEULAVersionAccepted"] || "0.0";
    var uagent = navigator.userAgent.toLowerCase();
    var confirmFunctionName = "nativeConfirm";
    if (uagent.match(/android/)) {
      confirmFunctionName = "confirm";
    }
    if (AutonetApplication.currentVersion > versionString) {
      AutonetApplication[confirmFunctionName](EULAText,
        function() {
          // success callback
          localStorage["LastEULAVersionAccepted"] = AutonetApplication.currentVersion;
          success();
        },
        function() {
          // failure callback
          AutonetApplication.exit();
        },
        "Agree",
        "Decline");
    } else {
      success();
    }
  },
  launch : function() {
    // Remove pages from the dom. attempted speedup.
    jQuery('div').live('pagehide', function(event, ui){
      var page = jQuery(event.target);
      AutonetApplication.debugLog("Removing Page: " + page);
      page.remove();
    });
    
    $.mobile.loadingMessage = "Connecting";
    
    $.ajaxSetup ({timeout: 1000 * 30}); // 8});
    
    console.log("Presenting EULA if neccesary.");
    AutonetApplication.presentEULA(AutonetApplication.continueLaunchAfterEULA);
  },
  continueLaunchAfterEULA : function() {
    // Load js-models
    UserCredentials.load();
    Unit.load();
    
    AutonetApplication.debugLog("App Launching...");
    
    // Load App Theming Info.
    var callback = AutonetApplication.continueLaunch;
    
    AutonetApplication.loadAppType(AutonetApplication.host, callback)
  },
  continueLaunch : function() {
    AutonetApplication.debugLog("Continuing Launch");
    
    document.addEventListener("pause", function() { 
      console.log("APPLICATION PAUSED");
      AutonetApplication.applicationPaused = true
    }, false);
    document.addEventListener("resume", function() { 
      console.log("APPLICATION Resumed");
      if (undefined != AutonetApplication.onResumeFunction) {
        f = AutonetApplication.onResumeFunction;
        AutonetApplication.onResumeFunction = undefined;
        f();
      }
      AutonetApplication.applicationPaused = false}, false);
    document.addEventListener("resume", AutonetApplication.resume, false);
    
    
    AutonetApplication.userCredentials = UserCredentials.first();
    if (AutonetApplication.userCredentials == undefined || AutonetApplication.userCredentials.attr("password").length == 0) {
      AutonetApplication.debugLog("No Credentials, showing login");
      LoginController.showLogin();
    } else {
      var loggedIn = false;
      AutonetApplication.login(AutonetApplication.userCredentials, function() {
        // Failure Callback
        AutonetApplication.debugLog("AutonetApplication.login: Login failed");
        if (!loggedIn) {
          LoginController.showLogin(); 
        }
      }, function() {
        // Success Callback
        loggedIn = true;
        
        // Fire off a refresh in the background
        AutonetApplication.getUnits(function(units){
          AutonetApplication.debugLog("Login Success from app launch..");
          if (Unit.controlledUnits().length == 0) {
            SettingsController.setup();
            return;
          }
          KeychainController.restoreLastUnit();
          AutonetApplication.debugLog("Resored last unit");
          if (KeychainController.currentUnitID) {
            AutonetApplication.debugLog("Showing Keychain");
            KeychainController.showKeychain({transition: 'none', reverse: false});
          } else {
            localStorage.removeItem("lastUnitID");
            AutonetApplication.debugLog("Showing settings")
            SettingsController.settings();
          }
        });
      });
    }
  },
  
  createHandleFailureCallback : function(failureCallback, retryCount) {
    var handleFailureCallback = function(message) {
      console.log("*** HANDLING FAILURE***: " + message)
      f = function() {
        if (retryCount < 10 && message == undefined) {
          if (false == retried) {
            retried = true;
            console.log("***RETRYING CONNECTION FAILURE*** " + retryCount)
            setTimeout(function() {
              var connection = AutonetApplication.openConnectionForUnit(unitID, unitPassword, userCredentials, failureCallback, successCallback, connectionUpdateFunction, retryCount+1);
              connectionUpdateFunction(connection);
            }, 2000);
          } else {
            return;
          }
        } else {
          retried = true; // don't retry even if we fall through again somehow.
          console.log("***Retried too many times. " + retryCount + " ***")
          failureCallback(message)
        }
      }
      if (AutonetApplication.applicationPaused === true) {
        AutonetApplication.onResumeFunction = f;
      } else {
        f()
      }
    }
    return handleFailureCallback;
  },
  
  openConnectionForUnit : function(unitID, unitPassword, userCredentials, failureCallback, successCallback, connectionUpdateFunction, retries) {
    AutonetApplication.debugLog("Opening Connection");
    var recievedError = false;
    var retried = false;
    var retryCount;
    retryCount = retries || 0;
    
    var handleFailure = AutonetApplication.createHandleFailureCallback(failureCallback, retryCount);
    
    var connectionFailureCallback = function() {
      $.mobile.hidePageLoadingMsg();
      if (!recievedError) { // don't send 2 error messages.
        handleFailure(AutonetApplication.connectionFailedMessage);
      }
    };
    
    var errorReceivedCallback = function(message) {
      $.mobile.hidePageLoadingMsg();
      recievedError = true;
      handleFailure(message);
    }
    
    var messageReceivedCallback = function(message) {
      $.mobile.hidePageLoadingMsg();
      if (connection.connectionIsWaitingForCommand) {
        successCallback();
      } else {
        AutonetApplication.alert("Unexpected message: " + message);
      }
    };
    
    // this.userCredentials = userCredentials;
    var connection = new AutonetConnection(unitID, unitPassword, userCredentials, connectionFailureCallback, messageReceivedCallback, errorReceivedCallback);
    connection.credentials = this.userCredentials;
    connection.resetConnectionFailures();
    
    connection.connect();
    return connection;
  },
  
  connectionUpdateFunction : function(connection) {
    this.connection = connection;
  },
  
  login : function(userCredentials, failureCallback, successCallback) {
    var connection = AutonetApplication.openConnectionForUnit("0000000000", userCredentials.attr('password'), userCredentials, 
                                                failureCallback, successCallback, AutonetApplication.connectionUpdateFunction);
    this.connection = connection;
  },
  
  logoutNoConfirmation : function () {
    AutonetApplication.connection.close();
    var creds = UserCredentials.first();
    creds.attr("password", "");
    creds.save();
    // Don't reset settings.
    // Unit.each(function() { this.destroy(); });
    localStorage.removeItem("AlertOnceKeys");
    AutonetApplication.connection = undefined;
    KeychainController.currentUnitID = undefined;
    if (KeychainController.keychainConnection) {
      KeychainController.keychainConnection.close();
      KeychainController.keychainConnection = undefined;
    }
    localStorage.lastLoginEmail = creds.attr("email");
    // LoginController.showLogin();
    // console.log("Loading: " + this.basePath() + "app/views/index/index.html");
    this.exit();
  },
  
  logout : function() {
    AutonetApplication.confirm(AutonetApplication.logoutConfirmationMessage, function() {
      AutonetApplication.logoutNoConfirmation();
    });
  },
  
  getUnits : function(callback) {
    AutonetApplication.debugLog("AutonetApplication.getUnits()");
    var units = new Array();
    var connection = this.connection;
    
    connection.connectionFailureCallback = function() {
      $.mobile.hidePageLoadingMsg();
      AutonetApplication.debugLog("Connection Failure!");
    };
    
    connection.errorReceivedCallback = function(message) {
      $.mobile.hidePageLoadingMsg();
      AutonetApplication.alert(message);
    }
    
    var userCredentials = this.userCredentials;
    var unitsNotDeleted = [];
    connection.messageReceivedCallback = function(message) {
       AutonetApplication.debugLog(message)
       if (message == "<<EOF>>") {
         // delete units not found!
         Unit.all().map(function(u) {
           if (-1 == unitsNotDeleted.indexOf(u)) {
             u.destroy();
           }
         });
         callback(Unit.all());
         connection.messageReceivedCallback = undefined;
         connection.errorReceivedCallback = undefined;
         connection.connectionFailureCallback = undefined;
       } else if (message == "Command?") {
         // ignore
       } else {
         var unit = Unit.parse(message);
         unitsNotDeleted.push(unit);
       }
    }
    
    connection.send("get units");
  },
  
  validatePhoneNumber : function(number) {
    number = number.replace(/(\D)/g, ""); // strip non-numbers
    if (!(number.length == 10)) {
      AutonetApplication.alert("You must enter a valid 10 digit phone number.")
      return false;
    }
    return number;
  }
  
};

var EULAText = "Welcome to Autonet Mobile provided by Autonet Mobile, Inc. (“us” or “we” or “Autonet”). This Agreement (“Agreement”) sets forth the terms and conditions among you and us that govern the Service. It replaces any earlier agreements between you and us regarding the Service and applies to all Autonet Mobile services you receive from us and any applications we make available for mobile devices.  We refer to the applications we make available for mobile devices as the “Autonet Mobile Applications” and all the Autonet Mobile services and Autonet Mobile Applications provided to you by us as the “Service.”<br/>\
PLEASE READ THIS AGREEMENT BEFORE USING THE SERVICE. READ AND KEEP A COPY OF ANY ADDITIONAL DOCUMENTS GIVEN OR SENT TO YOU. IF YOU ACCEPT ANY OF THE SERVICES DESCRIBED IN ANY DOCUMENT THAT SAYS IT BECOMES PART OF THIS AGREEMENT, SUCH DOCUMENT BECOMES PART OF THIS AGREEMENT. THE PRICE AND OTHER TERMS AND CONDITIONS OF YOUR SERVICE PLAN (“MOPAR CONNECT PLAN”) AND ANY OPTIONAL SERVICES OR ADDITIONAL APPLICATIONS YOU PURCHASE OR DOWNLOAD ARE A PART OF THIS AGREEMENT.<br/>\
YOUR MOPAR CONNECT SERVICE AND EQUIPMENT. In order to receive the Service, your car, truck, or other vehicle (your \"Car\") must be equipped with authorized Equipment.  “Equipment” means the hardware and software used to receive the Service. <br/>\
    Your Autonet Mobile Plan describes the specific services that we will provide to you and the associated fees, as well as optional features and services. <br/>\
STARTING THE SERVICE. You must accept this Agreement in order to receive and use the Service. Subject to local law, you accept this Agreement by buying or leasing a new or used Car that includes the Service in the purchase price, OR by signing a Autonet Mobile Plan or other written contract that includes this Agreement, OR by registering for the Service through a representative or on our website, OR by using the Service or accepting any of its benefits (including using a Car with active Equipment or using a Autonet Mobile Application) OR if you authorize someone to use your Car and they use the Service or accept any of its benefits. If you do ANY one or more of these five things to accept, you’re bound by this Agreement and any later changes or amendments to it.<br/>\
TERM OF YOUR SERVICE. We will begin providing the Service to you as set out above and will continue providing the Service to you until you or we terminate the Service as allowed in this Agreement.<br/>\
YOUR RIGHT TO TERMINATE THE SERVICE. You may terminate your Service at any time by calling us and letting a Autonet Mobile representative know that you want to terminate your Service. Unless your Autonet Mobile Plan specifies otherwise, if you terminate the Service we will refund to you any whole months and remaining days on your Autonet Mobile Plan for which you have paid in advance, except you will not receive a refund of any payment that was included in the purchase or lease price of your Car. You won’t be entitled to any other refunds for your Service. If you terminate your Service, we have the right to deactivate your Equipment and, if you decide to resume your Service, you may have to pay for any reactivation. <br/>\
TRANSFERRING YOUR SERVICE. You can’t transfer your Service to another Car or another person without our prior written consent. <br/>\
REACTIVATING OR CHANGING YOUR SERVICE. Only you (or your authorized agent) may make a request to activate, terminate, change, reactivate, or transfer your Service. If we accept and fulfill a request from you (or someone we believe is your authorized agent), you agree to pay any charges associated with that request.<br/>\
OUR RIGHT TO TERMINATE OR SUSPEND YOUR SERVICE.  We may terminate your Service without cause, in which case we will give you notice 30 days prior to the effective date of termination after which we will stop providing the Service to you and your account will be deactivated. This means that we can decide to cease providing the Service to you at any time and for any or no reason, even for reasons unrelated to you or your account with us.   In such a case, we’ll refund any amounts you have paid in advance, except you will not receive a refund of any amounts that were included in the purchase or lease price of your Car.  In any event we will not refund you any amounts for your Equipment. Also, we may terminate your Service without prior notice to you if you breach any part of this Agreement or don’t pay amounts that are due to us or one of our Service Providers. Even if you cure any of these problems, you don’t have any right to have the Service reactivated, and we may decide in our sole discretion whether to provide you with the Service again.  We can suspend your Service for any reason for which we could terminate it, for network or system maintenance or improvement, if there’s network congestion, or if we suspect the Service is being used for any purpose that would allow us to terminate it.<br/>\
CHANGES TO THIS AGREEMENT. From time to time, we may modify the terms of this Agreement, change the prices we charge you for the Service, or change, add, or delete any portion of the Service by giving you 15 days notice (or a longer period if required by law). If we provide you with notice of any change that materially affects your rights under this Agreement, or materially changes your Service, or results in higher costs charged you by us, YOU HAVE THE CHOICE TO EITHER CANCEL THIS AGREEMENT OR AGREE TO THE CHANGE. IF YOU DON'T CANCEL THIS AGREEMENT WITHIN 30 DAYS OF THE DATE OF THE NOTICE, YOU’RE AGREEING TO THE CHANGE AND IT BECOMES PART OF THIS AGREEMENT BETWEEN US. You can get a copy of the most current version of this Agreement by visiting our website at http://www.autonetmobile.net/eula.html, or by contacting us using the information provided below.<br/>\
PAYMENT.  You must pay us the fees for the Service you have selected in your Autonet Mobile Plan. If you start or stop your Service in the middle of a payment period, we’ll prorate the amounts owed or to be refunded to you, if applicable. By providing us with credit or debit card number or similar payment account information (“Payment Account”), you authorize us to, and we will, place that Payment Account on file and automatically charge that Payment Account the fees set forth in your Autonet Mobile Plan in accordance with the payment period set forth in your Autonet Mobile Plan.  All fees for the Service are payable in full and due in advance. Once you place your Payment Account on file with us, we may receive automatic updates of that Payment Account from the financial institution for that Payment Account in order to keep your Payment Account information current. If you do not provide us with a Payment Account, you must provide us with payment monthly (or other payment period offered by us and chosen by you) in advance. We’ll continue to charge your Payment Account monthly (or you must continue to make payments monthly) until you or we terminate your Service as allowed in this Agreement, or you choose another payment period offered by us. The fees for the Service may change over time, and we’ll use the rates then in effect for the applicable payment period for those charges.<br/>\
    If the purchase or lease price of your Car included a prepayment of the fees for the Service for a period of time, you must arrange for payment to us after this period of time expires. If you have a Payment Account on file with us, we will automatically start charging you as set out above.<br/>\
YOUR RESPONSIBILITY TO TELL US RIGHT AWAY ABOUT DISPUTED CHARGES.  If you object to any fees or charges for the Service, you must tell us in writing within 60 days after the fee or charge is incurred, (unless the law does not allow a limit or the law requires a longer period), OR YOU’RE WAIVING THE DISPUTE.<br/>\
TAXES AND GOVERNMENT FEES.  You promise to pay all federal, state and local taxes, and other fees and service charges that we’re required by law to collect and remit to the government on the Service.  These charges may change from time to time without advance notice.<br/>\
YOUR RESPONSIBILITY TO PAY FOR SERVICE CHARGES.    You promise to pay all applicable fees and service charges, which include, but are not limited to:  Federal Universal Service Fee, various federal, state or provincial regulatory fees, administrative charges, gross receipt charges, and charges for the costs we incur in complying with governmental programs, directly or indirectly.  They are rates that we choose to collect from you and are kept by us in whole or in part.  The number and type of service charges may vary depending upon the location of your primary billing address and can change over time without advance notice.<br/>\
USAGE LIMITS.  We may place usage limits on, or create tiered pricing plans for, the Service or any feature of the Service.  If we place any usage limits or provide tiered pricing plans for any feature of the Service, and your use of such feature of the Service exceeds the limit or tiered plan amount, we will charge you at our then current rates for your usage in excess of the limit or tiered plan amount. You agree that we may use any Payment Account that we have on file for payment of such charges.<br/>\
HOW THE SERVICE WORKS AND SYSTEM LIMITATIONS.   The Service is only available in the continental United States. The Service works using wireless communication networks and the Global Positioning System (\"GPS\") satellite network. NOT ALL FEATURES OF THE SERVICE ARE AVAILABLE EVERYWHERE, PARTICULARLY IN REMOTE OR ENCLOSED AREAS, OR ON ALL CARS, AT ALL TIMES.  The location of your Car may affect the Service that we can provide to you, including but not limited to routing service.<br/>\
    In order for the Service to work, your Car must be located in a place where we have an agreement with a wireless Service Provider for service in that area.  The Service also can’t work unless you’re in a place where the wireless Service Provider we’ve hired for that area has coverage, network capacity, and reception when the Service is needed, and technology that’s compatible with the Service.  The features of the Service that involve location information about your Car can’t work unless GPS satellite signals are unobstructed, available in that place and compatible with the Equipment as well.<br/>\
    The Equipment has an automatic air bag deployment response that will attempt to alert Emergency Service Providers if your Car is involved in a crash where the airbags deploy. YOUR CAR HAS TO HAVE A WORKING ELECTRICAL SYSTEM (INCLUDING ADEQUATE BATTERY POWER) FOR THE Equipment TO OPERATE.  The Service may not work if your Equipment or TTY equipment, if applicable, isn’t properly installed (by someone we’ve authorized) or you haven’t maintained it and your Car in good working order and in compliance with all government regulations. If you try to add, connect or modify any equipment or software in your Car (such as plugging devices into the vehicle electrical system or diagnostic port, or modifying the Equipment), the Service may not work and we may terminate your Service.  Your Equipment needs to be compatible with the Service and the wireless service and technology provided by our wireless Service Provider, too.  This wireless service and technology is subject to change.<br/>\
    There are other problems we can’t control that may prevent us from providing the Service to you at any particular time or place, or that may impair the quality of the Service. Some examples are hills, tall buildings, tunnels, weather, electrical system design and architecture of your Car, damage to important parts of your Car in an accident, or wireless phone network congestion or jamming. We are not responsible for any delay or failure in performance if such failure or delay could not have been prevented by reasonable precautions.  Additionally, we are not responsible if such failure or delay is caused by acts of nature, or forces or causes beyond our reasonable control.  Examples include public utility electrical failure, acts of war, government actions, terrorism, civil disturbances, labor shortages or difficulties (regardless of cause), or equipment failures including Internet, computer, telecommunication or other equipment failures.<br/>\
SERVICE PROVIDERS. We work with many different companies, individuals and government entities to provide you with the Service and Equipment.  In this Agreement, \"Service Provider\" means any person, company, or entity who provides any service, equipment, or facilities in connection with the Service or Equipment, including, but not limited to, wireless service providers, suppliers, licensors, public safety answering points, emergency responders and service providers (such as police, fire and ambulance), towing companies, car makers, distributors and dealers.<br/>\
MOPAR CONNECT SOFTWARE.  The Equipment includes software (”Autonet Mobile Software”) that we may need or want to update from time to time.  You agree that we may do this remotely without notifying you first. You acknowledge that such changes may affect or erase data you’ve stored on the Equipment in your Car and we aren’t responsible for any lost data.   We retain ownership of the Autonet Mobile Software and you do not acquire any rights to the Autonet Mobile Software, except that we grant you a non-exclusive license to use the Autonet Mobile Software solely as included with the Equipment for your personal, non-commercial use. Your Car systems also involve software that your car maker may need to change from time to time.  You agree that we may assist them to do this remotely without your consent.  <br/>\
MOPAR CONNECT APPLICATIONS.  Subject to the terms of this Agreement, we grant you a non-transferable, non-exclusive, license to download, install and use one copy of the Autonet Mobile Application on a mobile device that you own or control for your personal, non-commercial use.  We retain ownership of the Autonet Mobile Application and you do not acquire any rights to the Autonet Mobile Application except as set forth above.<br/>\
 RESTRICTIONS ON YOUR USE OF MOPAR CONNECT SOFTWARE AND MOPAR CONNECT APPLICATIONS.  Your right to use the Autonet Mobile Software and Autonet Mobile Application under this Agreement are subject to the following restrictions: (a) you shall not license, sell, rent, lease, transfer, assign, distribute, host, or otherwise commercially exploit the Autonet Mobile Software or Autonet Mobile Application; (b) you shall not modify, translate, adapt, merge, make derivative works of, disassemble, decompile, reverse compile or reverse engineer any part of the Autonet Mobile Software or Autonet Mobile Application, except to the extent the foregoing restrictions are expressly prohibited by applicable law; (c) you shall not access the Autonet Mobile Software or Autonet Mobile Application in order to build a similar or competitive product or service; (d) except as expressly stated herein, no part of the Autonet Mobile Software or Autonet Mobile Application may be copied, reproduced, distributed, republished, downloaded, displayed, posted or transmitted in any form or by any means, or (e) you shall not remove or destroy any copyright notices or other proprietary markings contained on or in the Autonet Mobile Application.   Any future release, update, or other addition to functionality of the Autonet Mobile Software or Autonet Mobile Application shall be subject to the terms of this Agreement.<br/>\
YOUR RESPONSIBILITY FOR THE SERVICE.   You are responsible for maintaining your Car and Equipment in good working condition. <br/>\
    You promise to use Autonet Mobile emergency services only for actual emergencies.  You promise not to use the Service for any fraudulent, unlawful, or abusive purpose, or in any way that interferes with our provision of the Service to our other customers.  You promise you won’t abuse or do anything to damage our business operations, services, reputation, employees, facilities, or Service Providers.  You agree not to interfere with our efforts to provide the Service, interfere with our business, or use the Service or wireless phone number for illegal or improper purposes.  You promise not to violate our acceptable use policy (located at http://www.autonetmobile.com/support/aup.html) and safety policy (located at http://www.autonetmobile.com/support/safety.html). If you do any of these things, you agree you’ll be responsible for any amount anyone else claims from us, plus any expenses, resulting in whole or in part from that use or your actions.<br/>\
YOUR RESPONSIBILITY FOR INFORMATION RECEIVED THROUGH THE SERVICE.  Certain information you receive through the Service belongs to us or third parties who provide it through us.   This information may be covered by one or more copyrights, trademarks, service marks, patents, or other legal protections.  You promise not to use any content you receive through the Service except as expressly authorized by us.  You can’t resell any of it or use it for commercial purposes.  You can’t copy, store, reproduce, distribute, modify, display, publish, perform, transmit, broadcast, or create derivative works from any of it.<br/>\
YOUR RESPONSIBILITY FOR OTHERS WHO USE THE SERVICE IN YOUR CAR OR WITH YOUR PERSONAL IDENTIFICATION NUMBER.  YOU’RE RESPONSIBLE FOR PROTECTING THE CONFIDENTIALITY OF YOUR PERSONAL IDENTIFICATION NUMBER AND/OR PASSWORD. YOU’RE SOLELY RESPONSIBLE FOR ANY USE OF THE SERVICE IN YOUR CAR OR WITH YOUR PERSONAL IDENTIFICATION NUMBER AND/OR PASSWORD, EVEN IF YOU LATER CLAIM THE USE WASN’T AUTHORIZED BY YOU. YOU’RE ALSO SOLELY RESPONSIBLE FOR THE SERVICES REQUESTED BY YOU, OR BY ANYONE USING YOUR CAR, THROUGH THE SERVICE. Neither we nor any Service Provider has any obligation to inquire about the authority of anyone using your Car. Neither we nor any Service Provider has any obligation to inquire about the authority of anyone using your Personal Identification Number and/or password or other information that can be used to identify your account to request services for your Car.  If you or a driver of your Car uses the Service to commit a crime or for another improper purpose, or in violation of this agreement, you agree that YOU WILL BE RESPONSIBLE FOR ANY CLAIMS MADE AGAINST US AND FOR ANY COSTS, DIRECT OR INDIRECT, INCURRED BY US ARISING OUT OF OR RELATED IN ANY WAY TO THAT CRIME, ACT, OR BREACH OF THIS AGREEMENT.  YOU AGREE TO PAY US IMMEDIATELY UPON DEMAND ALL SUCH AMOUNTS.<br/>\
<br/>\
YOUR RESPONSIBILITY FOR ALL TRANSACTIONS AND COMMUNICATIONS USING THE SERVICE.  You are solely responsible for any transaction that you carry out using the Service, and any use that you make of any information received from or through the Service.  You act at your own risk.<br/>\
<br/>\
YOU DON’T HAVE ANY RIGHTS IN YOUR Autonet Mobile NUMBERS.  You don’t have any rights to any identifying number (such as a Personal Identification Number) that you use with the Service or to any wireless phone number (such as the right to choose a number), except for any right you may have to port it under applicable law.  We reserve the right to change or reassign them, in which case we will notify you if we decide to change or reassign them.  A wireless phone number we assign for Autonet Mobile Hands-Free Calling may not be in your local area code.  <br/>\
BUYING, LEASING OR SELLING A CAR EQUIPPED WITH MOPAR CONNECT.  If you buy or lease a pre-owned Car equipped with Autonet Mobile, you promise to contact us promptly to create an account.  If you do not contact us, we may continue to send vehicle diagnostic reports or other information about the Car or the account to the billing or email address currently on file with us.  Further, you promise to notify us if you sell your Car or end its lease.  If you sell or transfer your Car and don’t notify us, you’ll remain responsible for all fees and charges for the Service.  You are responsible for erasing all data that you store on your Equipment before you sell or transfer your Car.  We are not responsible for any privacy related damages you may suffer if you fail to notify us of your purchase, lease or sale of a Autonet Mobile-Equipped Car or if you fail to erase the data you stored on the Equipment before selling or transferring your Car.<br/>\
YOUR PRIVACY.  Some of our key privacy practices are outlined in this section.  For a complete description of our privacy practices, please refer to our Privacy Statement.  We may update our Privacy Statement in accordance with the procedures set forth in the Privacy Statement.  We advise you to check for changes to the Privacy Statement periodically.  You can access the current Privacy Statement at http://my.autonetmobile.net/privacy.html or you can contact us to request a copy.<br/>\
<br/>\
    You acknowledge that it is your responsibility to advise all occupants of your Car (including other drivers) how information about them may be collected, used, and disclosed by us.<br/>\
<br/>\
    We may collect information about you and your Car in several different ways: from what you, your car dealer and car maker provide to us; from your use of the Service; from calls or emails between us; from Autonet Mobile web pages you visit; from our wireless Service Providers; from your satellite radio provider; from third party data providers; and from your Car itself when your Equipment is active.<br/>\
<br/>\
    The information we may collect about you includes your contact and billing information (including your credit card number); vehicle purchase information, registration information and information that helps us customize the Service.<br/>\
<br/>\
    The information we may get from your Car includes things such as: data about its operation; data about your use of the Service; the location of your Car; data about accidents involving your Car, including vehicle speed and safety belt usage; and information about your use of the Car and its features.  We may collect information from your Car on a periodic or regular basis.<br/>\
<br/>\
    You agree that we can, subject to applicable law, use this information to: provide the Service; manage your account or the Service; conduct analysis and research; comply with legal requirements; prevent fraud or misuse of the Service; protect our rights or property or the safety of you or others; send you important Car or Service related messages through the Service in your Car; and offer you new or additional products or services.<br/>\
<br/>\
    You also agree that we can, subject to applicable law, share information about you and your Car with: 1) our Service Providers; and 2) the maker of your Car, its subsidiaries and affiliates; your Car dealer, our wireless Service Providers and your satellite radio provider for their business purposes. We may also share this information with others as may be required by law, or to protect our rights or property or the safety of you or others.  We may also share information about fleet cars with fleet companies and information about rental cars with rental companies.<br/>\
<br/>\
    WE WILL NOT  OTHERWISE DISCLOSE, SELL, OR RENT INFORMATION SPECIFIC TO YOU OR YOUR CAR TO THIRD PARTIES FOR THEIR INDEPENDENT MARKETING USE WITHOUT YOUR CONSENT.<br/>\
<br/>\
    Because the Service communicates over wireless networks, we can’t promise that your communications won’t be intercepted by others.  You agree we won’t be liable for any damages for any loss of privacy occurring in communication over such networks.<br/>\
<br/>\
YOUR INTERACTIONS WITH OUR representatives.  We may record and monitor communications made using the Equipment between you and our representatives, emergency Service Providers, the police, or third parties.  Please note that our Autonet Mobile representatives remain on the line if they conference in a third party to assist in completing a service request.  We may also monitor your interactions with our automated services for quality improvement purposes.  Nothing in this Agreement requires us to release any audio or physical records that are created as part of the Service without a subpoena (unless otherwise required by law).<br/>\
<br/>\
NO WARRANTIES ON EQUIPMENT, INFORMATION, OR SERVICE.  Warranties are special kinds of promises. WE DON’T MAKE ANY WARRANTIES, EXPRESS OR IMPLIED, ABOUT the Equipment. The maker of your Car may provide you with a warranty on the Equipment or other equipment, but that warranty is between you and the maker of your Car, not between you and us. In addition, we cannot promise that the Service will be uninterrupted or problem-free, and cannot promise that the data or information provided to you will be error-free.  THE SERVICE AND ALL DATA AND INFORMATION ARE PROVIDED TO YOU ON AN \"AS IS\" BASIS.  NEITHER WE, NOR ANY OF OUR Service Providers, MAKE ANY WARRANTIES, EXPRESS OR IMPLIED, ABOUT THE SERVICE OR ABOUT ANY DATA OR INFORMATION PROVIDED THROUGH IT, INCLUDING THE WARRANTIES OF CONTENT, QUALITY, ACCURACY, TIMELINESS, COMPLETENESS, CORRECTNESS, TITLE, NON-INFRINGEMENT, RELIABILITY, MERCHANTABILITY, OR FITNESS FOR A PARTICULAR PURPOSE.  ALL SUCH WARRANTIES ARE EXPRESSLY EXCLUDED BY THIS AGREEMENT.<br/>\
<br/>\
LIMITATIONS OF LIABILITY.  YOU AND US ARE EACH WAIVING IMPORTANT RIGHTS. UNLESS FORBIDDEN BY LAW IN A PARTICULAR INSTANCE, YOU AND WE EACH AGREE AS FOLLOWS:<br/>\
<br/>\
WE AREN’T LIABLE FOR THE ACTIONS OR INACTIONS OF ANY Service Provider WE CONTACT FOR YOU OR YOUR CAR, OR FOR OUR INABILITY TO CONTACT ANY Service Provider IN ANY PARTICULAR SITUATION.<br/>\
WE AREN’T LIABLE TO YOU FOR (1) ANY PERSONAL INJURIES OR PROPERTY DAMAGE ARISING OUT OF OR RELATING TO YOUR USE OF the Equipment OR the SERVICE, including but not limited to personal injuries or property damage arising out of the use of any applications on the Equipment or Pre-Arrival Instructions (EMD-Emergency Medical Dispatch) capability OR (2) ANY DAMAGES ARISING OUT OF OR RELATING TO THE INSTALLATION, REPAIR, OR MAINTENANCE OF the Equipment.<br/>\
WE HAVE NO LIABILITY FOR SERVICE INTERRUPTIONS THAT LAST FOR 24 HOURS OR LESS. IF THE SERVICE IS INTERRUPTED FOR A LONGER PERIOD OF TIME, YOU MAY REQUEST A SERVICE CREDIT BY NOTIFYING US IN WRITING WITHIN 60 DAYS AFTER THE TIME WHEN THAT SERVICE INTERRUPTION STARTED. EXCEPT AS STATED IN THIS PARAGRAPH, NEITHER WE NOR OUR SERVICE PROVIDERS ARE LIABLE TO YOU FOR DROPPED CALLS OR INTERRUPTED SERVICE, OR FOR PROBLEMS CAUSED BY OR CONTRIBUTED TO BY YOU, BY ANY THIRD PARTY, BY BUILDINGS, HILLS, TUNNELS, NETWORK CONGESTION, WEATHER, OR ANY OTHER THING OUTSIDE THE CONTROL OF US OR OUR SERVICE PROVIDERS.<br/>\
NOTWITHSTANDING ANYTHING ELSE IN THIS AGREEMENT, YOU AGREE TO EXCUSE ANY NON-PERFORMANCE BY US OR ANY Service Provider CAUSED IN WHOLE OR IN PART BY AN ACT OR OMISSION OF A THIRD PARTY, OR BY ANY EQUIPMENT FAILURE, ACT OF GOD, NATURAL DISASTER, STRIKE, EQUIPMENT OR FACILITY SHORTAGE, OR OTHER CAUSES BEYOND THE CONTROL OF US OR OUR Service Providers.<br/>\
YOU AGREE THAT NEITHER WE NOR ANY Service Provider FROM WHOM YOU RECEIVE ANY DATA OR INFORMATION THROUGH the Service IS LIABLE FOR ANY ERRORS, DEFECTS, PROBLEMS, OR MISTAKES IN THAT DATA OR INFORMATION.<br/>\
OUR MAXIMUM LIABILITY TO YOU UNDER ANY THEORY (INCLUDING BUT NOT LIMITED TO FRAUD, MISREPRESENTATION, BREACH OF CONTRACT, TORT, OR PRODUCTS LIABILITY) IS LIMITED TO AN AMOUNT EQUAL TO THE FEES PAYABLE BY YOU FOR THE SERVICE DURING THE PAYMENT PERIOD DURING WHICH SUCH DAMAGES OCCUR.<br/>\
YOU CANNOT RECOVER (1) PUNITIVE DAMAGES, (2) CONSEQUENTIAL, INDIRECT, OR SPECIAL DAMAGES, OR (3) ATTORNEY’S FEES. YOU CANNOT RECOVER THESE TYPES OF DAMAGES OR FEES FROM ANY Service Provider, EITHER.  YOU AGREE NOT TO MAKE, AND TO WAIVE TO THE FULLEST EXTENT ALLOWED BY LAW, ANY CLAIM FOR DAMAGES OTHER THAN DIRECT, COMPENSATORY DAMAGES AS LIMITED IN THIS AGREEMENT.<br/>\
If another wireless service provider is involved in any dispute (for example, because of roaming), you also agree to any limitations of liability that it imposes on its customers.<br/>\
YOU AGREE THAT THIS AGREEMENT DOES NOT CREATE A CONTRACTUAL RELATIONSHIP BETWEEN YOU AND ANY OF OUR WIRELESS SERVICE PROVIDERS AND YOU AREN’T A THIRD PARTY BENEFICIARY OF ANY AGREEMENT BETWEEN US AND ANY OF OUR WIRELESS SERVICE PROVIDERS. Unless you have a separate contract with them, NONE OF OUR WIRELESS SERVICE PROVIDERS HAS ANY LEGAL, EQUITABLE, OR OTHER LIABILITY OF ANY KIND TO YOU. YOU WAIVE ANY AND ALL CLAIMS OR DEMANDS FOR SUCH LIABILITY.<br/>\
YOU AGREE THAT THE CHRYSLER GROUP DOESN’T HAVE ANY LEGAL, EQUITABLE, OR OTHER LIABILITY OF ANY KIND TO YOU IN CONNECTION WITH THE SERVICE. YOU WAIVE ANY AND ALL CLAIMS OR DEMANDS FOR SUCH LIABILITY.<br/>\
You agree that the limitations of liability and indemnities in this Agreement will survive even after the Agreement has ended. These limitations of liability apply not only to you, but to anyone using your Car, to anyone making a claim on your behalf, and to any claims made by your family, employees, customers, or others arising out of or relating to the Service or Equipment.<br/>\
    NOTE:  Some states don’t allow an exclusion or limitation of incidental or consequential damages or certain other damages, so some of the limitations above may not apply in some situations.<br/>\
<br/>\
YOUR RESPONSIBILITY FOR INSURANCE.  The Service we provide is intended as a convenience. The payments you make for that Service aren’t related to the value of your Car or any property in it, or the cost of any injury to or damages suffered by you. We aren’t an insurance company. You promise you’ll obtain and maintain appropriate insurance covering personal injury to you and others, covering loss of or damage to your property or the property of others, and other risks arising when you use the Service. FOR YOURSELF AND FOR ANYONE ELSE CLAIMING UNDER YOU, YOU HEREBY RELEASE AND DISCHARGE US AND OUR Service Providers, THEIR PARENT COMPANIES, AFFILIATES, AND SUBSIDIARIES, AND THE RESPECTIVE OFFICERS, DIRECTORS, AND EMPLOYEES OF ANY OF THEM FROM AND AGAINST ALL HAZARDS COVERED BY YOUR INSURANCE. NO INSURANCE COMPANY OR INSURER WILL HAVE ANY RIGHT OF SUBROGATION AGAINST US OR OUR Service Providers.<br/>\
<br/>\
YOUR RESPONSIBLITY FOR CLAIMS IN SOME CIRCUMSTANCES.  As a condition to receiving THE Service, YOU AGREE THAT YOU’LL BE RESPONSIBLE FOR ANY AMOUNT ANYONE ELSE CLAIMS FROM US (OR OUR Service Providers, THEIR OFFICERS, EMPLOYEES, AFFILIATES AND AGENTS) PLUS ANY EXPENSES, RESULTING FROM ANY CLAIM, DEMAND OR ACTION, REGARDLESS OF THE NATURE OF THE CAUSE OF THE CLAIM, DEMAND, OR ACTION, ALLEGING LOSS, COSTS, EXPENSES, DAMAGES, OR PERSONAL INJURIES (INCLUDING PERSONAL INJURIES RESULTING IN DEATH) ARISING OUT OF OR IN CONNECTION WITH (1) THE ACTIVITIES CONTEMPLATED BY THIS AGREEMENT, WHETHER BROUGHT BY YOU, YOUR EMPLOYEES, OR THIRD PARTIES, EVEN IF DUE TO THE SOLE NEGLIGENCE OF ANY OF THE Service Providers; (2) THE USE OR POSSESSION OF DATA OR INFORMATION PROVIDED IN CONNECTION WITH THE SERVICE; (3) CLAIMS FOR LIBEL, SLANDER, OR ANY PROPERTY DAMAGE, PERSONAL INJURY OR DEATH, ARISING OUT OF OR RELATED IN ANY WAY DIRECTLY OR INDIRECTLY TO THIS AGREEMENT; or (4) THE USE, FAILURE TO USE, OR INABILITY TO USE THE SERVICE, EXCEPT WHERE THE CLAIMS RESULT FROM THE GROSS NEGLIGENCE OR WILLFUL MISCONDUCT OF ANY OF THE Service Providers.<br/>\
<br/>\
    In addition, if you’ve provided us with your Payment Account information, THEN YOUR AGREEMENT IN THIS SECTION EXTENDS TO CLAIMS, EXPENSES, LIABILITIES, OR DAMAGES ARISING OUT OF OR IN CONNECTION WITH THE USE OR OWNERSHIP OF THE PAYMENT ACCOUNT, OR FROM THE ISSUER OF SUCH PAYMENT ACCOUNT’S REFUSAL TO PAY AMOUNTS CHARGED TO SUCH PAYMENT ACCOUNT.<br/>\
<br/>\
HOW DISPUTES WILL BE RESOLVED.  If you and we have a disagreement related to the Service, we’ll try to resolve it by talking with each other. If we can’t resolve it that way, WE BOTH AGREE, TO THE FULLEST EXTENT PERMITTED BY LAW, TO USE CONFIDENTIAL ARBITRATION, NOT LAWSUITS (except for small claims court cases) TO RESOLVE THE DISPUTE. Of course, either of us can always contact a government agency or regulatory authority for help, too.  Here’s how private arbitration will work:<br/>\
PLEASE READ THIS CAREFULLY.  IT AFFECTS YOUR RIGHTS.<br/>\
    Except for either party’s claims of infringement or misappropriation of the other party’s patent, copyright, trademark, or trade secret, any and all disputes between You and us arising under or related in any way to this Agreement, must be resolved through binding arbitration as described in this section.  This agreement to arbitrate is intended to be interpreted broadly.  It includes, but is not limited to, all claims and disputes relating to Your use of the Service, products or services provided by our Service Providers, and claims relating to our advertising of the Service.  <br/>\
    YOU AGREE THAT BY ENTERING INTO THIS AGREEMENT, YOU AND WE ARE EACH WAIVING THE RIGHT TO TRIAL BY JURY OR TO PARTICIPATE IN A CLASS ACTION.  YOU AND WE AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR OUR INDIVIDUAL CAPACITY, AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE PROCEEDING.  ANY ARBITRATION WILL TAKE PLACE ON AN INDIVIDUAL BASIS; CLASS ARBITRATIONS AND CLASS ACTIONS ARE NOT PERMITTED.  <br/>\
    The arbitration will be governed by the Commercial Arbitration Rules and the Supplementary Procedures for Consumer Related Disputes of the American Arbitration Association (“AAA”), as modified by this section.  For any claim where the total amount of the award sought is $10,000 or less, the AAA, you and us must abide by the following rules:  (a) the arbitration shall be conducted solely based on written submissions; and (b) the arbitration shall not involve any personal appearance by the parties or witnesses unless otherwise mutually agreed by the parties.  If the claim exceeds $10,000, the right to a hearing will be determined by the AAA rules, and the hearing (if any) must take place in Your choice of the following locations: San Francisco, CA, or New York, NY.  The arbitrator’s ruling is binding and may be entered as a judgment in any court of competent jurisdiction.  Each party shall bear its own costs (including attorney fees) and disbursements arising out of the arbitration, and shall pay an equal share of the fees and costs of the AAA. In the event this agreement to arbitrate is held unenforceable by a court, then the disputes that would otherwise have been arbitrated shall be exclusively brought in the state or federal courts located in San Francisco County, California.  Claims of infringement or misappropriation of the other party’s patent, copyright, trademark, or trade secret shall be exclusively brought in the state and federal courts located in San Francisco County, California.<br/>\
    You and we agree that the arbitration, including the evidence, the argument and the outcome, is confidential between us.  Each of us can tell our lawyers and, if necessary, our financial advisors and insurers about the arbitration if they agree to keep it confidential too.  We can both tell others but only if required by law.  The arbitrator we appoint has to agree to this confidentiality protection too.  Nothing in this agreement prevents either of us from filing the arbitration award with a court to enforce or appeal such award, though we agree that the evidence and arguments of the parties related to such award will be treated as confidential information subject to court approved protective order.<br/>\
THE LAW THAT GOVERNS OUR RELATIONSHIP.   To the fullest extent permitted by law, and except as explicitly provided otherwise, this Agreement and any disputes arising out of or relating to it will be governed by the laws of the state of California without regard to its conflict of law principles, and by any applicable tariffs, wherever filed.  [If you move your vehicle purchased or leased in the United States to another country where the Service is provided, such Service will be provided by the local Autonet Mobile provider and be subject to its terms and conditions, including its choice of law, as well as its pricing.  Those terms and prices can be obtained by you by visiting its website.]<br/>\
<br/>\
HOW WE CAN PROVIDE NOTICES TO EACH OTHER.  IF ANY PROVISION OF THIS AGREEMENT REQUIRES NOTICE, THEN THE FOLLOWING RULES APPLY.   ANY NOTICE FROM US WILL BE CONSIDERED GIVEN WHEN WE SEND IT BY EMAIL TO THE MOST CURRENT EMAIL ADDRESS YOU’VE PROVIDED TO US, OR TWO DAYS AFTER WE MAIL IT TO YOU AT THE MOST CURRENT BILLING ADDRESS WE HAVE ON FILE FOR YOU, OR AS SOON AS WE POST A NOTICE OF CHANGE ON THE www.autonetmobile.net WEBSITE. ANY NOTICE FROM YOU REQUIRED BY THIS AGREEMENT WILL BE CONSIDERED GIVEN WHEN WE RECEIVE IT AT OUR ADDRESS PROVIDED AT THE END OF THIS AGREEMENT.  <br/>\
<br/>\
WHO ELSE THIS AGREEMENT COVERS.  Our Service Providers and our affiliates are intended beneficiaries of this agreement. You agree that you’ll make any of your passengers or guests or drivers of your Car aware of our rights and subject to the limitations of this Agreement.<br/>\
<br/>\
OUR RELATIONSHIP WITH YOU.  No matter what else it says, this Agreement doesn’t create any fiduciary relationships between you and us, or between you and any of the Service Providers.  It doesn’t create any relationship of principal and agent, partnership, or employer and employee, either.<br/>\
<br/>\
WE CAN ASSIGN THIS AGREEMENT.  We can assign this Agreement or your obligations to pay under it in whole or in part to anyone we choose. You can’t assign this agreement or your obligations to anyone else without our prior written consent.<br/>\
<br/>\
THIS IS THE ENTIRE AGREEMENT.  This Agreement is the entire agreement between you and us. It supersedes all other agreements or representations, oral or written, between us, past or present, and may not be amended except in a writing signed by us.  Amendments of which we give notice and post to the Autonet Mobile website at www.autonetmobile.com will be deemed a writing signed by us.   If any part of this Agreement is considered invalid by a court or arbitrator, the rest of it will remain enforceable, except that if a court or arbitrator refuses to enforce the waiver of class arbitration in the arbitration clause for any particular dispute between us, the entire arbitration clause will be void and unenforceable as to that particular dispute. Even after this Agreement has ended, its provisions will govern any disputes arising out of or relating to it (unless it’s been replaced by a new agreement between us). It will also be binding on your heirs and successors and on our successors. No waiver of any part of this Agreement, or of any breach of it, in any one instance will require us to waive any other instance or breach. IN SOME CIRCUMSTANCES WE MIGHT DECIDE TO PROVIDE YOU SERVICE VOLUNTARILY EVEN IF YOU WOULDN’T OTHERWISE QUALIFY. THIS WON’T BE A WAIVER OR REQUIRE US TO DO SO AGAIN. YOU AGREE WE WON’T BE LIABLE FOR ANYTHING RESULTING FROM OUR PROVISION OF SUCH SERVICE.<br/>\
Apple App Store Additional Terms and Conditions.  The following additional terms and conditions apply to you if you are using a Autonet Mobile Application from the Apple App Store.  To the extent the other terms and conditions of this Agreement are less restrictive than, or otherwise conflict with, the terms and conditions of this Section 38, the more restrictive or conflicting terms and conditions in this Section 38 apply, but solely with respect to Autonet Mobile Applications from the Apple App Store.<br/>\
Acknowledgement: You and we acknowledge that this Agreement is concluded between Autonet and you only, and not with Apple, and Autonet, not Apple, is solely responsible for the Autonet Mobile Application and the content thereof.  To the extent this Agreement provides for usage rules for the Autonet Mobile Application that are less restrictive than the Usage Rules set forth for the Autonet Mobile Application in, or otherwise is in conflict with, the App Store Terms of Service, the more restrictive or conflicting Apple term applies.<br/>\
Scope of License: The license granted to you for the Autonet Mobile Application is limited to a non-transferable license to use the Autonet Mobile Application on an iOS Product that you own or control and as permitted by the Usage Rules set forth in the App Store Terms of Service.<br/>\
Maintenance and Support: We are solely responsible for providing any maintenance and support services with respect to the Autonet Mobile Application, as specified in this Agreement (if any), or as required under applicable law. You and we acknowledge that Apple has no obligation whatsoever to furnish any maintenance and support services with respect to the Autonet Mobile Application.<br/>\
Warranty: We are solely responsible for any product warranties, whether express or implied by law, to the extent not effectively disclaimed. In the event of any failure of the Autonet Mobile Application to conform to any applicable warranty, you may notify Apple, and Apple will refund the purchase price for the Autonet Mobile Application to you; and to the maximum extent permitted by applicable law, Apple will have no other warranty obligation whatsoever with respect to the Autonet Mobile Application, and any other claims, losses, liabilities, damages, costs or expenses attributable to any failure to conform to any warranty will be our sole responsibility.<br/>\
Product Claims: You and we acknowledge that we, not Apple, are responsible for addressing any claims of you or any third party relating to the Autonet Mobile Application or your possession and/or use of the Autonet Mobile Application, including, but not limited to: (i) product liability claims; (ii) any claim that the Autonet Mobile Application fails to conform to any applicable legal or regulatory requirement; and (iii) claims arising under consumer protection or similar legislation. This Agreement does not limit our liability to you beyond what is permitted by applicable law.<br/>\
Intellectual Property Rights: You and we acknowledge that, in the event of any third party claim that the Autonet Mobile Application or your possession and use of the Autonet Mobile Application infringes that third party’s intellectual property rights, we, not Apple, will be solely responsible for the investigation, defense, settlement and discharge of any such intellectual property infringement claim.<br/>\
Legal Compliance: You represent and warrant that (i) you are not located in a country that is subject to a U.S. Government embargo, or that has been designated by the U.S. Government as a “terrorist supporting” country; and (ii) you are not listed on any U.S. Government list of prohibited or restricted parties. <br/>\
Developer Name and Address: Our contact information for any end-user questions, complaints or claims with respect to the Autonet Mobile Application is set forth in Section 39.<br/>\
Third Party Terms of Agreement: You must comply with applicable third party terms of agreement when using the Autonet Mobile Application.<br/>\
Third Party Beneficiary: You and we acknowledge and agree that Apple, and Apple’s  subsidiaries, are third party beneficiaries of this Agreement, and that, upon your acceptance of the terms and conditions of this Agreement, Apple will have the right (and will be deemed to have accepted the right) to enforce this Agreement against you as a third party beneficiary thereof.<br/>\
You can contact us at any time by calling us at 1-855-756-6727 or emailing us at support@moparconnect.net.  In addition, you may contact us at the postal address set forth below:<br/>\
Autonet Mobile, Inc.<br/>\
1700 Montgomery Street, Suite 111<br/>\
San Francisco, CA 94111<br/>\
<br/>\
<br/>\
<br/>\
"
