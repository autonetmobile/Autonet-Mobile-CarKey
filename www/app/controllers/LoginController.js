// Login Controller. Singleton.
var LoginController = {
  showLogin: function() {
    AutonetApplication.debugLog("show login");
    if (AutonetApplication.stylesheetUrl) {
      $('head').append(AutonetApplication.stylesheetTagText);
    }
    AutonetApplication.loadPage("app/views/login/login.html", {transition: 'slideup'})
  },
  loginButtonWasPressed : function() {
    var email = $("#email").val().replace(/\s/g, "");
    var password = $("#password").val();
    var phoneNumber = $("#phone_number").val();
    phoneNumber = AutonetApplication.validatePhoneNumber(phoneNumber);
    if (!phoneNumber) {
      return;
    }
    var providerServer = $("#provider").val();
    
    // Validations
    if ("" == email) {
      AutonetApplication.alert("Email Address is required.");
      return;
    }
    if ("" == providerServer) {
      AutonetApplication.alert("You must select a provider from the list");
      return;
    }
    // End Validations
    
    var userCredentials = UserCredentials.first();
    var userIsLoggingBackIn = false;
    if (!userCredentials) {
      userCredentials = new UserCredentials({'email': email, 'password': password, 'phoneNumber': phoneNumber, 'providerServer': providerServer});
    } else {
      userCredentials.attr("email", email);
      userCredentials.attr("password", password);
      userCredentials.attr("phoneNumber", phoneNumber);
      userCredentials.attr("providerServer", providerServer);
      userIsLoggingBackIn = (userCredentials.attr("email") == localStorage.lastLoginEmail);
    }
    var displayedError = false;
    AutonetApplication.login(userCredentials, function(failureMessage) {
      AutonetApplication.debugLog("Login Failed: " + failureMessage);
      if (!displayedError) {
        displayedError = true;
        AutonetApplication.alert(failureMessage);
      }
    }, function() {
      localStorage.lastLoginEmail = userCredentials.attr("email");                   
      // Show the app type alert.                                       
      if (AutonetApplication.message) {
        AutonetApplication.alertOnce(AutonetApplication.appType + "-alert-message", AutonetApplication.message, undefined, true);
      }
      if (userIsLoggingBackIn) {
        AutonetApplication.debugLog("Login succeeded, user logged back in. showing keychain.");
        KeychainController.showKeychain();
      } else {
        Unit.each(function() { this.destroy(); });
        AutonetApplication.debugLog("Login succeeded, showing units.");
        SettingsController.showUnits({transition: 'slideup', reverse: true});
      }
    });
  }
}