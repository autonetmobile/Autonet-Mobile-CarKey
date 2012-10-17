var TemporaryAlert = function() {};

TemporaryAlert.prototype.show = function(message, successCallback, failureCallback) {
  console.log("executing phonegap temporary alert.")
  return PhoneGap.exec(successCallback,    //Success callback from the plugin
                       failureCallback,     //Error callback from the plugin
                       'com.twotoasters.temporaryalert',  //Tell PhoneGap to run "DirectoryListingPlugin" Plugin
                       'show',              //Tell plugin, which action we want to perform
                       [message]);        //Passing list of args to the plugin
};

PhoneGap.addConstructor(function() {
	/**
	 * Phonegap version < 1.0
	 * use the following line
	 */
  //PhoneGap.addPlugin('com.twotoasters.temporaryalert', new TemporaryAlert());
  console.log("REGISTERING TEMPORARY ALERT");
  navigator.temporaryalert = new TemporaryAlert();      
  //   PluginManager.addService("TemporaryAlert","com.twotoasters.temporaryalert");
});

// var TemporaryAlert = {
//   show : function(message,successCallback, failureCallback) {
//     console.log("executing phonegap temporary alert.")
//     return PhoneGap.exec(successCallback,    //Success callback from the plugin
//                          failureCallback,     //Error callback from the plugin
//                          'TemporaryAlert',  //Tell PhoneGap to run "DirectoryListingPlugin" Plugin
//                          'show',              //Tell plugin, which action we want to perform
//                          [message]);        //Passing list of args to the plugin
//   }
// }