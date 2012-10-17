var SettingsController = {
  setup : function() {
    AutonetApplication.debugLog("Loading units!");
    // Load Stylesheet
    if (AutonetApplication.stylesheetUrl) {
      $('head').append(AutonetApplication.stylesheetTagText);
    }
    AutonetApplication.getUnits(function(units) {
      AutonetApplication.debugLog("Got Units!: " + units);
      AutonetApplication.loadPage("app/views/settings/setup.html", {transition: 'slideup'});
      $('#setup').die();
      $('#setup').live('pagecreate', function() {
        AutonetApplication.debugLog("Units: " + units);
        if (units.length > 0) {
          var options = "<fieldset data-role=\"controlgroup\" data-role=\"fieldcontain\">";
          for (i = 0; i < units.length; i ++) {
            var unit = units[i];
            options += "<input type=\"checkbox\" class=\"custom\" id=\"unit" + unit.attr('unitID') + "\" value=\"" + unit.attr('unitID') + "\" > </input>"
            options += "<label for=\"unit" + unit.attr('unitID') + "\">" + unit.getDisplayName() + "</label>";
          }
          options += "</fieldset>"
          AutonetApplication.debugLog("Options: " + options);
          $("#select-units").html("<div id='scroll' style=\"max-height:245px\">"+options+"</div>");
          var myscroll = new iScroll('scroll', {});
          setTimeout(function() {
            myscroll.refresh();
          }, 3000);
        } else {
          $("#setup-content").html("<p class='instructions'>You have no units associated with your account. Please visit <a href='http://www.autonetmobile.com' target='blank'>www.autonetmobile.com</a> to set up your account</a>.</p> \
          <a href='#' data-role='button' onclick='AutonetApplication.logoutNoConfirmation()'>Log Out</a>");
        }
      });
    });
  },
  saveSetupButtonWasPressed : function() {
    var unitIDs = [];
    $("input:checkbox").each(function(){ 
      var unit = Unit.findByUnitID($(this).val());
      unit.attr('controlled', ($(this).attr("checked") ? true : false));
      unit.save();
    });
    if (Unit.controlledUnits().length == 0) {
      AutonetApplication.alert("You must select at least 1 car to continue.");
      return;
    }
    
    SettingsController.showUnits();
  },
  settings : function(options) {
    AutonetApplication.debugLog("SETTINGS");
    // Settings should show two rows, My Account and My Units.
    options = options || {};
    options.transition = options.transition || 'slide';
    
    // Load Stylesheet
    if (AutonetApplication.stylesheetUrl) {
      $('head').append("<link rel=\"stylesheet\" href=\"" + AutonetApplication.stylesheetUrl + "\" type=\"text/css\" charset=\"utf-8\" >");
    }
    
    AutonetApplication.loadPage("app/views/settings/settings.html", options);
  },
  myAccount : function(options) {
    // Phone Number, Providers, Test SMS.
    options = options || {};
    options.transition = options.transition || 'slide';
    
    AutonetApplication.loadPage("app/views/settings/account.html", options);
  },
  save : function(phoneNumber, providerServer) {
    phoneNumber = AutonetApplication.validatePhoneNumber(phoneNumber);
    if (!phoneNumber) {
      return;
    }
    var userCreds = AutonetApplication.getUserCredentials();
    userCreds.attr("phoneNumber", phoneNumber);
    userCreds.attr("providerServer", providerServer);
    userCreds.save();
    AutonetApplication.alert("Phone Number Updated.");
  },
  testSMS : function(phoneNumber, providerServer) {
    phoneNumber = AutonetApplication.validatePhoneNumber(phoneNumber);
    if (!phoneNumber) {
      return;
    }
    var userCreds = AutonetApplication.getUserCredentials();
    userCreds.attr("phoneNumber", phoneNumber);
    userCreds.attr("providerServer", providerServer);
    AutonetApplication.login(userCreds, function(failureMessage) {
      AutonetApplication.alert(failureMessage);
    }, function () {
      // success
      // TODO: setup callback?
      AutonetApplication.connection.messageReceivedCallback = (function(message) {
        if (message != "Command?") {
          AutonetApplication.connection.messageReceivedCallback = undefined;
          AutonetApplication.alert(message);
        }
      });
      AutonetApplication.connection.send("test sms");
    });
  },
  showUnits : function(options) {
    AutonetApplication.debugLog("Show Units!");
    // If we have not selected which units this device is to control, do that instead.
    if (Unit.controlledUnits().length == 0) {
      SettingsController.setup();
      return;
    }
    
    options = options || {};
    options.transition = options.transition || 'slide';
    
    var connection = AutonetApplication.connection;
    
    var updateUI = function() {
      var units = Unit.all();
      // Success
      AutonetApplication.debugLog("Loaded units: " + units);
    
      content = "<ul data-role=\"listview\" data-theme=\"g\">";
      for (i=0;i<units.length;i++) {   
        var unit = units[i];
        content += "<li><a href='#' onclick='SettingsController.showUnit(\"" + unit.attr('unitID') + "\");'>" + unit.getDisplayName() + (unit.attr("controlled") ? "" : " (hidden)") + "</a></li>";
      }
      content += "</ul>"
      $("#rows").replaceWith($(content));
      AutonetApplication.debugLog("Content: " + content);
      setTimeout(function() {
        AutonetApplication.alertOnce("settings-intro",
        "Here you can add passwords to the cars which you would like to be able to control regularly. Select a device to enter a password, then tap save. If you do not enter a password, you will be prompted to enter one every time you view the keychain for that car.",
        undefined,
        true);
      }, 1000);
    }
    AutonetApplication.getUnits(function() {
      AutonetApplication.loadPage("app/views/settings/show_units.html", options);
      $('#units-index').die();
      $('#units-index').live('pagecreate', function() {
        updateUI();
      });
    })
  },
  
  showUnit : function(unitID) {
     var unit = Unit.findByUnitID(unitID);
     SettingsController.currentUnit = unit;
     AutonetApplication.loadPage("app/views/settings/show.html", {transition: 'slide'});
  },
  saveButtonWasPressed : function() {
    var unit = SettingsController.currentUnit;
    unit.attr('password', $("#password").val());
    unit.attr('controlled', $("#controlled").prop("checked"));
    unit.attr('update', $("#update").prop("checked"));
    unit.save();
    AutonetApplication.backButtonWasPressed();
    AutonetApplication.alert(AutonetApplication.settingsSavedMessage)
  }
}