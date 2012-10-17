var uagent = navigator.userAgent.toLowerCase();
if (uagent.match(/android/)) {
  // contents of phonegap-1.1.0.js
  /*
   * PhoneGap is available under *either* the terms of the modified BSD license *or* the
   * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
   *
   * Copyright (c) 2005-2010, Nitobi Software Inc.
   * Copyright (c) 2010-2011, IBM Corporation
   */

  if (typeof PhoneGap === "undefined") {

  /**
   * The order of events during page load and PhoneGap startup is as follows:
   *
   * onDOMContentLoaded         Internal event that is received when the web page is loaded and parsed.
   * window.onload              Body onload event.
   * onNativeReady              Internal event that indicates the PhoneGap native side is ready.
   * onPhoneGapInit             Internal event that kicks off creation of all PhoneGap JavaScript objects (runs constructors).
   * onPhoneGapReady            Internal event fired when all PhoneGap JavaScript objects have been created
   * onPhoneGapInfoReady        Internal event fired when device properties are available
   * onDeviceReady              User event fired to indicate that PhoneGap is ready
   * onResume                   User event fired to indicate a start/resume lifecycle event
   * onPause                    User event fired to indicate a pause lifecycle event
   * onDestroy                  Internal event fired when app is being destroyed (User should use window.onunload event, not this one).
   *
   * The only PhoneGap events that user code should register for are:
   *      onDeviceReady
   *      onResume
   *
   * Listeners can be registered as:
   *      document.addEventListener("deviceready", myDeviceReadyListener, false);
   *      document.addEventListener("resume", myResumeListener, false);
   *      document.addEventListener("pause", myPauseListener, false);
   */

  if (typeof(DeviceInfo) !== 'object') {
      var DeviceInfo = {};
  }

  /**
   * This represents the PhoneGap API itself, and provides a global namespace for accessing
   * information about the state of PhoneGap.
   * @class
   */
  var PhoneGap = {
      queue: {
          ready: true,
          commands: [],
          timer: null
      },
      documentEventHandler: {},   // Collection of custom document event handlers
      windowEventHandler: {}      // Collection of custom window event handlers
  };

  /**
   * List of resource files loaded by PhoneGap.
   * This is used to ensure JS and other files are loaded only once.
   */
  PhoneGap.resources = {base: true};

  /**
   * Determine if resource has been loaded by PhoneGap
   *
   * @param name
   * @return
   */
  PhoneGap.hasResource = function(name) {
      return PhoneGap.resources[name];
  };

  /**
   * Add a resource to list of loaded resources by PhoneGap
   *
   * @param name
   */
  PhoneGap.addResource = function(name) {
      PhoneGap.resources[name] = true;
  };

  /**
   * Custom pub-sub channel that can have functions subscribed to it
   * @constructor
   */
  PhoneGap.Channel = function (type)
  {
      this.type = type;
      this.handlers = {};
      this.guid = 0;
      this.fired = false;
      this.enabled = true;
  };

  /**
   * Subscribes the given function to the channel. Any time that
   * Channel.fire is called so too will the function.
   * Optionally specify an execution context for the function
   * and a guid that can be used to stop subscribing to the channel.
   * Returns the guid.
   */
  PhoneGap.Channel.prototype.subscribe = function(f, c, g) {
      // need a function to call
      if (f === null) { return; }

      var func = f;
      if (typeof c === "object" && typeof f === "function") { func = PhoneGap.close(c, f); }

      g = g || func.observer_guid || f.observer_guid || this.guid++;
      func.observer_guid = g;
      f.observer_guid = g;
      this.handlers[g] = func;
      return g;
  };

  /**
   * Like subscribe but the function is only called once and then it
   * auto-unsubscribes itself.
   */
  PhoneGap.Channel.prototype.subscribeOnce = function(f, c) {
      var g = null;
      var _this = this;
      var m = function() {
          f.apply(c || null, arguments);
          _this.unsubscribe(g);
      };
      if (this.fired) {
          if (typeof c === "object" && typeof f === "function") { f = PhoneGap.close(c, f); }
          f.apply(this, this.fireArgs);
      } else {
          g = this.subscribe(m);
      }
      return g;
  };

  /**
   * Unsubscribes the function with the given guid from the channel.
   */
  PhoneGap.Channel.prototype.unsubscribe = function(g) {
      if (typeof g === "function") { g = g.observer_guid; }
      this.handlers[g] = null;
      delete this.handlers[g];
  };

  /**
   * Calls all functions subscribed to this channel.
   */
  PhoneGap.Channel.prototype.fire = function(e) {
      if (this.enabled) {
          var fail = false;
          var item, handler, rv;
          for (item in this.handlers) {
              if (this.handlers.hasOwnProperty(item)) {
                  handler = this.handlers[item];
                  if (typeof handler === "function") {
                      rv = (handler.apply(this, arguments) === false);
                      fail = fail || rv;
                  }
              }
          }
          this.fired = true;
          this.fireArgs = arguments;
          return !fail;
      }
      return true;
  };

  /**
   * Calls the provided function only after all of the channels specified
   * have been fired.
   */
  PhoneGap.Channel.join = function(h, c) {
      var i = c.length;
      var f = function() {
          if (!(--i)) {
              h();
          }
      };
      var len = i;
      var j;
      for (j=0; j<len; j++) {
          if (!c[j].fired) {
              c[j].subscribeOnce(f);
          }
          else {
              i--;
          }
      }
      if (!i) {
          h();
      }
  };

  /**
   * Boolean flag indicating if the PhoneGap API is available and initialized.
   */ // TODO: Remove this, it is unused here ... -jm
  PhoneGap.available = DeviceInfo.uuid !== undefined;

  /**
   * Add an initialization function to a queue that ensures it will run and initialize
   * application constructors only once PhoneGap has been initialized.
   * @param {Function} func The function callback you want run once PhoneGap is initialized
   */
  PhoneGap.addConstructor = function(func) {
      PhoneGap.onPhoneGapInit.subscribeOnce(function() {
          try {
              func();
          } catch(e) {
              console.log("Failed to run constructor: " + e);
          }
      });
  };

  /**
   * Plugins object
   */
  if (!window.plugins) {
      window.plugins = {};
  }

  /**
   * Adds a plugin object to window.plugins.
   * The plugin is accessed using window.plugins.<name>
   *
   * @param name          The plugin name
   * @param obj           The plugin object
   */
  PhoneGap.addPlugin = function(name, obj) {
      if (!window.plugins[name]) {
          window.plugins[name] = obj;
      }
      else {
          console.log("Error: Plugin "+name+" already exists.");
      }
  };

  /**
   * onDOMContentLoaded channel is fired when the DOM content
   * of the page has been parsed.
   */
  PhoneGap.onDOMContentLoaded = new PhoneGap.Channel('onDOMContentLoaded');

  /**
   * onNativeReady channel is fired when the PhoneGap native code
   * has been initialized.
   */
  PhoneGap.onNativeReady = new PhoneGap.Channel('onNativeReady');

  /**
   * onPhoneGapInit channel is fired when the web page is fully loaded and
   * PhoneGap native code has been initialized.
   */
  PhoneGap.onPhoneGapInit = new PhoneGap.Channel('onPhoneGapInit');

  /**
   * onPhoneGapReady channel is fired when the JS PhoneGap objects have been created.
   */
  PhoneGap.onPhoneGapReady = new PhoneGap.Channel('onPhoneGapReady');

  /**
   * onPhoneGapInfoReady channel is fired when the PhoneGap device properties
   * has been set.
   */
  PhoneGap.onPhoneGapInfoReady = new PhoneGap.Channel('onPhoneGapInfoReady');

  /**
   * onPhoneGapConnectionReady channel is fired when the PhoneGap connection properties
   * has been set.
   */
  PhoneGap.onPhoneGapConnectionReady = new PhoneGap.Channel('onPhoneGapConnectionReady');

  /**
   * onResume channel is fired when the PhoneGap native code
   * resumes.
   */
  PhoneGap.onResume = new PhoneGap.Channel('onResume');

  /**
   * onPause channel is fired when the PhoneGap native code
   * pauses.
   */
  PhoneGap.onPause = new PhoneGap.Channel('onPause');

  /**
   * onDestroy channel is fired when the PhoneGap native code
   * is destroyed.  It is used internally.
   * Window.onunload should be used by the user.
   */
  PhoneGap.onDestroy = new PhoneGap.Channel('onDestroy');
  PhoneGap.onDestroy.subscribeOnce(function() {
      PhoneGap.shuttingDown = true;
  });
  PhoneGap.shuttingDown = false;

  // _nativeReady is global variable that the native side can set
  // to signify that the native code is ready. It is a global since
  // it may be called before any PhoneGap JS is ready.
  if (typeof _nativeReady !== 'undefined') { PhoneGap.onNativeReady.fire(); }

  /**
   * onDeviceReady is fired only after all PhoneGap objects are created and
   * the device properties are set.
   */
  PhoneGap.onDeviceReady = new PhoneGap.Channel('onDeviceReady');


  // Array of channels that must fire before "deviceready" is fired
  PhoneGap.deviceReadyChannelsArray = [ PhoneGap.onPhoneGapReady, PhoneGap.onPhoneGapInfoReady, PhoneGap.onPhoneGapConnectionReady];

  // Hashtable of user defined channels that must also fire before "deviceready" is fired
  PhoneGap.deviceReadyChannelsMap = {};

  /**
   * Indicate that a feature needs to be initialized before it is ready to be used.
   * This holds up PhoneGap's "deviceready" event until the feature has been initialized
   * and PhoneGap.initComplete(feature) is called.
   *
   * @param feature {String}     The unique feature name
   */
  PhoneGap.waitForInitialization = function(feature) {
      if (feature) {
          var channel = new PhoneGap.Channel(feature);
          PhoneGap.deviceReadyChannelsMap[feature] = channel;
          PhoneGap.deviceReadyChannelsArray.push(channel);
      }
  };

  /**
   * Indicate that initialization code has completed and the feature is ready to be used.
   *
   * @param feature {String}     The unique feature name
   */
  PhoneGap.initializationComplete = function(feature) {
      var channel = PhoneGap.deviceReadyChannelsMap[feature];
      if (channel) {
          channel.fire();
      }
  };

  /**
   * Create all PhoneGap objects once page has fully loaded and native side is ready.
   */
  PhoneGap.Channel.join(function() {

      // Start listening for XHR callbacks
      setTimeout(function() {
              if (PhoneGap.UsePolling) {
                  PhoneGap.JSCallbackPolling();
              }
              else {
                  var polling = prompt("usePolling", "gap_callbackServer:");
                  PhoneGap.UsePolling = polling;
                  if (polling == "true") {
                      PhoneGap.UsePolling = true;
                      PhoneGap.JSCallbackPolling();
                  }
                  else {
                      PhoneGap.UsePolling = false;
                      PhoneGap.JSCallback();
                  }
              }
          }, 1);

      // Run PhoneGap constructors
      PhoneGap.onPhoneGapInit.fire();

      // Fire event to notify that all objects are created
      PhoneGap.onPhoneGapReady.fire();

      // Fire onDeviceReady event once all constructors have run and PhoneGap info has been
      // received from native side, and any user defined initialization channels.
      PhoneGap.Channel.join(function() {
          // Let native code know we are inited on JS side
          prompt("", "gap_init:");

          PhoneGap.onDeviceReady.fire();

          // Fire the onresume event, since first one happens before JavaScript is loaded
          PhoneGap.onResume.fire();
      }, PhoneGap.deviceReadyChannelsArray);

  }, [ PhoneGap.onDOMContentLoaded, PhoneGap.onNativeReady ]);

  // Listen for DOMContentLoaded and notify our channel subscribers
  document.addEventListener('DOMContentLoaded', function() {
      PhoneGap.onDOMContentLoaded.fire();
  }, false);

  // Intercept calls to document.addEventListener and watch for deviceready
  PhoneGap.m_document_addEventListener = document.addEventListener;

  // Intercept calls to window.addEventListener
  PhoneGap.m_window_addEventListener = window.addEventListener;

  /**
   * Add a custom window event handler.
   *
   * @param {String} event            The event name that callback handles
   * @param {Function} callback       The event handler
   */
  PhoneGap.addWindowEventHandler = function(event, callback) {
      PhoneGap.windowEventHandler[event] = callback;
  }

  /**
   * Add a custom document event handler.
   *
   * @param {String} event            The event name that callback handles
   * @param {Function} callback       The event handler
   */
  PhoneGap.addDocumentEventHandler = function(event, callback) {
      PhoneGap.documentEventHandler[event] = callback;
  }

  /**
   * Intercept adding document event listeners and handle our own
   *
   * @param {Object} evt
   * @param {Function} handler
   * @param capture
   */
  document.addEventListener = function(evt, handler, capture) {
      var e = evt.toLowerCase();
      if (e === 'deviceready') {
          PhoneGap.onDeviceReady.subscribeOnce(handler);
      } else if (e === 'resume') {
          PhoneGap.onResume.subscribe(handler);
          if (PhoneGap.onDeviceReady.fired) {
              PhoneGap.onResume.fire();
          }
      } else if (e === 'pause') {
          PhoneGap.onPause.subscribe(handler);
      }
      else {
          // If subscribing to Android backbutton
          if (e === 'backbutton') {
              PhoneGap.exec(null, null, "App", "overrideBackbutton", [true]);
          }

          // If subscribing to an event that is handled by a plugin
          else if (typeof PhoneGap.documentEventHandler[e] !== "undefined") {
              if (PhoneGap.documentEventHandler[e](e, handler, true)) {
                  return; // Stop default behavior
              }
          }

          PhoneGap.m_document_addEventListener.call(document, evt, handler, capture);
      }
  };

  /**
   * Intercept adding window event listeners and handle our own
   *
   * @param {Object} evt
   * @param {Function} handler
   * @param capture
   */
  window.addEventListener = function(evt, handler, capture) {
      var e = evt.toLowerCase();

      // If subscribing to an event that is handled by a plugin
      if (typeof PhoneGap.windowEventHandler[e] !== "undefined") {
          if (PhoneGap.windowEventHandler[e](e, handler, true)) {
              return; // Stop default behavior
          }
      }

      PhoneGap.m_window_addEventListener.call(window, evt, handler, capture);
  };

  // Intercept calls to document.removeEventListener and watch for events that
  // are generated by PhoneGap native code
  PhoneGap.m_document_removeEventListener = document.removeEventListener;

  // Intercept calls to window.removeEventListener
  PhoneGap.m_window_removeEventListener = window.removeEventListener;

  /**
   * Intercept removing document event listeners and handle our own
   *
   * @param {Object} evt
   * @param {Function} handler
   * @param capture
   */
  document.removeEventListener = function(evt, handler, capture) {
      var e = evt.toLowerCase();

      // If unsubscribing to Android backbutton
      if (e === 'backbutton') {
          PhoneGap.exec(null, null, "App", "overrideBackbutton", [false]);
      }

      // If unsubcribing from an event that is handled by a plugin
      if (typeof PhoneGap.documentEventHandler[e] !== "undefined") {
          if (PhoneGap.documentEventHandler[e](e, handler, false)) {
              return; // Stop default behavior
          }
      }

      PhoneGap.m_document_removeEventListener.call(document, evt, handler, capture);
  };

  /**
   * Intercept removing window event listeners and handle our own
   *
   * @param {Object} evt
   * @param {Function} handler
   * @param capture
   */
  window.removeEventListener = function(evt, handler, capture) {
      var e = evt.toLowerCase();

      // If unsubcribing from an event that is handled by a plugin
      if (typeof PhoneGap.windowEventHandler[e] !== "undefined") {
          if (PhoneGap.windowEventHandler[e](e, handler, false)) {
              return; // Stop default behavior
          }
      }

      PhoneGap.m_window_removeEventListener.call(window, evt, handler, capture);
  };

  /**
   * Method to fire document event
   *
   * @param {String} type             The event type to fire
   * @param {Object} data             Data to send with event
   */
  PhoneGap.fireDocumentEvent = function(type, data) {
      var e = document.createEvent('Events');
      e.initEvent(type);
      if (data) {
          for (var i in data) {
              e[i] = data[i];
          }
      }
      document.dispatchEvent(e);
  };

  /**
   * Method to fire window event
   *
   * @param {String} type             The event type to fire
   * @param {Object} data             Data to send with event
   */
  PhoneGap.fireWindowEvent = function(type, data) {
      var e = document.createEvent('Events');
      e.initEvent(type);
      if (data) {
          for (var i in data) {
              e[i] = data[i];
          }
      }
      window.dispatchEvent(e);
  };

  /**
   * If JSON not included, use our own stringify. (Android 1.6)
   * The restriction on ours is that it must be an array of simple types.
   *
   * @param args
   * @return {String}
   */
  PhoneGap.stringify = function(args) {
      if (typeof JSON === "undefined") {
          var s = "[";
          var i, type, start, name, nameType, a;
          for (i = 0; i < args.length; i++) {
              if (args[i] !== null) {
                  if (i > 0) {
                      s = s + ",";
                  }
                  type = typeof args[i];
                  if ((type === "number") || (type === "boolean")) {
                      s = s + args[i];
                  } else if (args[i] instanceof Array) {
                      s = s + "[" + args[i] + "]";
                  } else if (args[i] instanceof Object) {
                      start = true;
                      s = s + '{';
                      for (name in args[i]) {
                          if (args[i][name] !== null) {
                              if (!start) {
                                  s = s + ',';
                              }
                              s = s + '"' + name + '":';
                              nameType = typeof args[i][name];
                              if ((nameType === "number") || (nameType === "boolean")) {
                                  s = s + args[i][name];
                              } else if ((typeof args[i][name]) === 'function') {
                                  // don't copy the functions
                                  s = s + '""';
                              } else if (args[i][name] instanceof Object) {
                                  s = s + PhoneGap.stringify(args[i][name]);
                              } else {
                                  s = s + '"' + args[i][name] + '"';
                              }
                              start = false;
                          }
                      }
                      s = s + '}';
                  } else {
                      a = args[i].replace(/\\/g, '\\\\');
                      a = a.replace(/"/g, '\\"');
                      s = s + '"' + a + '"';
                  }
              }
          }
          s = s + "]";
          return s;
      } else {
          return JSON.stringify(args);
      }
  };

  /**
   * Does a deep clone of the object.
   *
   * @param obj
   * @return {Object}
   */
  PhoneGap.clone = function(obj) {
      var i, retVal;
      if(!obj) { 
          return obj;
      }

      if(obj instanceof Array){
          retVal = [];
          for(i = 0; i < obj.length; ++i){
              retVal.push(PhoneGap.clone(obj[i]));
          }
          return retVal;
      }

      if (typeof obj === "function") {
          return obj;
      }

      if(!(obj instanceof Object)){
          return obj;
      }

      if (obj instanceof Date) {
          return obj;
      }

      retVal = {};
      for(i in obj){
          if(!(i in retVal) || retVal[i] !== obj[i]) {
              retVal[i] = PhoneGap.clone(obj[i]);
          }
      }
      return retVal;
  };

  PhoneGap.callbackId = 0;
  PhoneGap.callbacks = {};
  PhoneGap.callbackStatus = {
      NO_RESULT: 0,
      OK: 1,
      CLASS_NOT_FOUND_EXCEPTION: 2,
      ILLEGAL_ACCESS_EXCEPTION: 3,
      INSTANTIATION_EXCEPTION: 4,
      MALFORMED_URL_EXCEPTION: 5,
      IO_EXCEPTION: 6,
      INVALID_ACTION: 7,
      JSON_EXCEPTION: 8,
      ERROR: 9
      };


  /**
   * Execute a PhoneGap command.  It is up to the native side whether this action is synch or async.
   * The native side can return:
   *      Synchronous: PluginResult object as a JSON string
   *      Asynchrounous: Empty string ""
   * If async, the native side will PhoneGap.callbackSuccess or PhoneGap.callbackError,
   * depending upon the result of the action.
   *
   * @param {Function} success    The success callback
   * @param {Function} fail       The fail callback
   * @param {String} service      The name of the service to use
   * @param {String} action       Action to be run in PhoneGap
   * @param {Array.<String>} [args]     Zero or more arguments to pass to the method
   */
  PhoneGap.exec = function(success, fail, service, action, args) {
      try {
          var callbackId = service + PhoneGap.callbackId++;
          if (success || fail) {
              PhoneGap.callbacks[callbackId] = {success:success, fail:fail};
          }

          var r = prompt(PhoneGap.stringify(args), "gap:"+PhoneGap.stringify([service, action, callbackId, true]));

          // If a result was returned
          if (r.length > 0) {
              eval("var v="+r+";");

              // If status is OK, then return value back to caller
              if (v.status === PhoneGap.callbackStatus.OK) {

                  // If there is a success callback, then call it now with
                  // returned value
                  if (success) {
                      try {
                          success(v.message);
                      } catch (e) {
                          console.log("Error in success callback: " + callbackId  + " = " + e);
                      }

                      // Clear callback if not expecting any more results
                      if (!v.keepCallback) {
                          delete PhoneGap.callbacks[callbackId];
                      }
                  }
                  return v.message;
              }

              // If no result
              else if (v.status === PhoneGap.callbackStatus.NO_RESULT) {

                  // Clear callback if not expecting any more results
                  if (!v.keepCallback) {
                      delete PhoneGap.callbacks[callbackId];
                  }
              }

              // If error, then display error
              else {
                  console.log("Error: Status="+v.status+" Message="+v.message);

                  // If there is a fail callback, then call it now with returned value
                  if (fail) {
                      try {
                          fail(v.message);
                      }
                      catch (e1) {
                          console.log("Error in error callback: "+callbackId+" = "+e1);
                      }

                      // Clear callback if not expecting any more results
                      if (!v.keepCallback) {
                          delete PhoneGap.callbacks[callbackId];
                      }
                  }
                  return null;
              }
          }
      } catch (e2) {
          console.log("Error: "+e2);
      }
  };

  /**
   * Called by native code when returning successful result from an action.
   *
   * @param callbackId
   * @param args
   */
  PhoneGap.callbackSuccess = function(callbackId, args) {
      if (PhoneGap.callbacks[callbackId]) {

          // If result is to be sent to callback
          if (args.status === PhoneGap.callbackStatus.OK) {
              try {
                  if (PhoneGap.callbacks[callbackId].success) {
                      PhoneGap.callbacks[callbackId].success(args.message);
                  }
              }
              catch (e) {
                  console.log("Error in success callback: "+callbackId+" = "+e);
              }
          }

          // Clear callback if not expecting any more results
          if (!args.keepCallback) {
              delete PhoneGap.callbacks[callbackId];
          }
      }
  };

  /**
   * Called by native code when returning error result from an action.
   *
   * @param callbackId
   * @param args
   */
  PhoneGap.callbackError = function(callbackId, args) {
      if (PhoneGap.callbacks[callbackId]) {
          try {
              if (PhoneGap.callbacks[callbackId].fail) {
                  PhoneGap.callbacks[callbackId].fail(args.message);
              }
          }
          catch (e) {
              console.log("Error in error callback: "+callbackId+" = "+e);
          }

          // Clear callback if not expecting any more results
          if (!args.keepCallback) {
              delete PhoneGap.callbacks[callbackId];
          }
      }
  };


  /**
   * Internal function used to dispatch the request to PhoneGap.  It processes the
   * command queue and executes the next command on the list.  If one of the
   * arguments is a JavaScript object, it will be passed on the QueryString of the
   * url, which will be turned into a dictionary on the other end.
   * @private
   */
  // TODO: Is this used?
  PhoneGap.run_command = function() {
      if (!PhoneGap.available || !PhoneGap.queue.ready) {
          return;
      }
      PhoneGap.queue.ready = false;

      var args = PhoneGap.queue.commands.shift();
      if (PhoneGap.queue.commands.length === 0) {
          clearInterval(PhoneGap.queue.timer);
          PhoneGap.queue.timer = null;
      }

      var uri = [];
      var dict = null;
      var i;
      for (i = 1; i < args.length; i++) {
          var arg = args[i];
          if (arg === undefined || arg === null) {
              arg = '';
          }
          if (typeof(arg) === 'object') {
              dict = arg;
          } else {
              uri.push(encodeURIComponent(arg));
          }
      }
      var url = "gap://" + args[0] + "/" + uri.join("/");
      if (dict !== null) {
          var name;
          var query_args = [];
          for (name in dict) {
              if (dict.hasOwnProperty(name) && (typeof (name) === 'string')) {
                  query_args.push(encodeURIComponent(name) + "=" + encodeURIComponent(dict[name]));
              }
          }
          if (query_args.length > 0) {
              url += "?" + query_args.join("&");
          }
      }
      document.location = url;

  };

  PhoneGap.JSCallbackPort = null;
  PhoneGap.JSCallbackToken = null;

  /**
   * This is only for Android.
   *
   * Internal function that uses XHR to call into PhoneGap Java code and retrieve
   * any JavaScript code that needs to be run.  This is used for callbacks from
   * Java to JavaScript.
   */
  PhoneGap.JSCallback = function() {

      // Exit if shutting down app
      if (PhoneGap.shuttingDown) {
          return;
      }

      // If polling flag was changed, start using polling from now on
      if (PhoneGap.UsePolling) {
          PhoneGap.JSCallbackPolling();
          return;
      }

      var xmlhttp = new XMLHttpRequest();

      // Callback function when XMLHttpRequest is ready
      xmlhttp.onreadystatechange=function(){
          if(xmlhttp.readyState === 4){

              // Exit if shutting down app
              if (PhoneGap.shuttingDown) {
                  return;
              }

              // If callback has JavaScript statement to execute
              if (xmlhttp.status === 200) {

                  // Need to url decode the response
                  var msg = decodeURIComponent(xmlhttp.responseText);
                  setTimeout(function() {
                      try {
                          var t = eval(msg);
                      }
                      catch (e) {
                          // If we're getting an error here, seeing the message will help in debugging
                          console.log("JSCallback: Message from Server: " + msg);
                          console.log("JSCallback Error: "+e);
                      }
                  }, 1);
                  setTimeout(PhoneGap.JSCallback, 1);
              }

              // If callback ping (used to keep XHR request from timing out)
              else if (xmlhttp.status === 404) {
                  setTimeout(PhoneGap.JSCallback, 10);
              }

              // If security error
              else if (xmlhttp.status === 403) {
                  console.log("JSCallback Error: Invalid token.  Stopping callbacks.");
              }

              // If server is stopping
              else if (xmlhttp.status === 503) {
                  console.log("JSCallback Error: Service unavailable.  Stopping callbacks.");
              }

              // If request wasn't GET
              else if (xmlhttp.status === 400) {
                  console.log("JSCallback Error: Bad request.  Stopping callbacks.");
              }

              // If error, revert to polling
              else {
                  console.log("JSCallback Error: Request failed.");
                  PhoneGap.UsePolling = true;
                  PhoneGap.JSCallbackPolling();
              }
          }
      };

      if (PhoneGap.JSCallbackPort === null) {
          PhoneGap.JSCallbackPort = prompt("getPort", "gap_callbackServer:");
      }
      if (PhoneGap.JSCallbackToken === null) {
          PhoneGap.JSCallbackToken = prompt("getToken", "gap_callbackServer:");
      }
      xmlhttp.open("GET", "http://127.0.0.1:"+PhoneGap.JSCallbackPort+"/"+PhoneGap.JSCallbackToken , true);
      xmlhttp.send();
  };

  /**
   * The polling period to use with JSCallbackPolling.
   * This can be changed by the application.  The default is 50ms.
   */
  PhoneGap.JSCallbackPollingPeriod = 50;

  /**
   * Flag that can be set by the user to force polling to be used or force XHR to be used.
   */
  PhoneGap.UsePolling = false;    // T=use polling, F=use XHR

  /**
   * This is only for Android.
   *
   * Internal function that uses polling to call into PhoneGap Java code and retrieve
   * any JavaScript code that needs to be run.  This is used for callbacks from
   * Java to JavaScript.
   */
  PhoneGap.JSCallbackPolling = function() {

      // Exit if shutting down app
      if (PhoneGap.shuttingDown) {
          return;
      }

      // If polling flag was changed, stop using polling from now on
      if (!PhoneGap.UsePolling) {
          PhoneGap.JSCallback();
          return;
      }

      var msg = prompt("", "gap_poll:");
      if (msg) {
          setTimeout(function() {
              try {
                  var t = eval(""+msg);
              }
              catch (e) {
                  console.log("JSCallbackPolling: Message from Server: " + msg);
                  console.log("JSCallbackPolling Error: "+e);
              }
          }, 1);
          setTimeout(PhoneGap.JSCallbackPolling, 1);
      }
      else {
          setTimeout(PhoneGap.JSCallbackPolling, PhoneGap.JSCallbackPollingPeriod);
      }
  };

  /**
   * Create a UUID
   *
   * @return {String}
   */
  PhoneGap.createUUID = function() {
      return PhoneGap.UUIDcreatePart(4) + '-' +
          PhoneGap.UUIDcreatePart(2) + '-' +
          PhoneGap.UUIDcreatePart(2) + '-' +
          PhoneGap.UUIDcreatePart(2) + '-' +
          PhoneGap.UUIDcreatePart(6);
  };

  PhoneGap.UUIDcreatePart = function(length) {
      var uuidpart = "";
      var i, uuidchar;
      for (i=0; i<length; i++) {
          uuidchar = parseInt((Math.random() * 256),0).toString(16);
          if (uuidchar.length === 1) {
              uuidchar = "0" + uuidchar;
          }
          uuidpart += uuidchar;
      }
      return uuidpart;
  };

  PhoneGap.close = function(context, func, params) {
      if (typeof params === 'undefined') {
          return function() {
              return func.apply(context, arguments);
          };
      } else {
          return function() {
              return func.apply(context, params);
          };
      }
  };

  /**
   * Load a JavaScript file after page has loaded.
   *
   * @param {String} jsfile               The url of the JavaScript file to load.
   * @param {Function} successCallback    The callback to call when the file has been loaded.
   */
  PhoneGap.includeJavascript = function(jsfile, successCallback) {
      var id = document.getElementsByTagName("head")[0];
      var el = document.createElement('script');
      el.type = 'text/javascript';
      if (typeof successCallback === 'function') {
          el.onload = successCallback;
      }
      el.src = jsfile;
      id.appendChild(el);
  };

  }
  /*
   * PhoneGap is available under *either* the terms of the modified BSD license *or* the
   * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
   *
   * Copyright (c) 2005-2010, Nitobi Software Inc.
   * Copyright (c) 2010-2011, IBM Corporation
   */

  if (!PhoneGap.hasResource("accelerometer")) {
  PhoneGap.addResource("accelerometer");

  /** @constructor */
  var Acceleration = function(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.timestamp = new Date().getTime();
  };

  /**
   * This class provides access to device accelerometer data.
   * @constructor
   */
  var Accelerometer = function() {

      /**
       * The last known acceleration.  type=Acceleration()
       */
      this.lastAcceleration = null;

      /**
       * List of accelerometer watch timers
       */
      this.timers = {};
  };

  Accelerometer.ERROR_MSG = ["Not running", "Starting", "", "Failed to start"];

  /**
   * Asynchronously aquires the current acceleration.
   *
   * @param {Function} successCallback    The function to call when the acceleration data is available
   * @param {Function} errorCallback      The function to call when there is an error getting the acceleration data. (OPTIONAL)
   * @param {AccelerationOptions} options The options for getting the accelerometer data such as timeout. (OPTIONAL)
   */
  Accelerometer.prototype.getCurrentAcceleration = function(successCallback, errorCallback, options) {

      // successCallback required
      if (typeof successCallback !== "function") {
          console.log("Accelerometer Error: successCallback is not a function");
          return;
      }

      // errorCallback optional
      if (errorCallback && (typeof errorCallback !== "function")) {
          console.log("Accelerometer Error: errorCallback is not a function");
          return;
      }

      // Get acceleration
      PhoneGap.exec(successCallback, errorCallback, "Accelerometer", "getAcceleration", []);
  };

  /**
   * Asynchronously aquires the acceleration repeatedly at a given interval.
   *
   * @param {Function} successCallback    The function to call each time the acceleration data is available
   * @param {Function} errorCallback      The function to call when there is an error getting the acceleration data. (OPTIONAL)
   * @param {AccelerationOptions} options The options for getting the accelerometer data such as timeout. (OPTIONAL)
   * @return String                       The watch id that must be passed to #clearWatch to stop watching.
   */
  Accelerometer.prototype.watchAcceleration = function(successCallback, errorCallback, options) {

      // Default interval (10 sec)
      var frequency = (options !== undefined)? options.frequency : 10000;

      // successCallback required
      if (typeof successCallback !== "function") {
          console.log("Accelerometer Error: successCallback is not a function");
          return;
      }

      // errorCallback optional
      if (errorCallback && (typeof errorCallback !== "function")) {
          console.log("Accelerometer Error: errorCallback is not a function");
          return;
      }

      // Make sure accelerometer timeout > frequency + 10 sec
      PhoneGap.exec(
          function(timeout) {
              if (timeout < (frequency + 10000)) {
                  PhoneGap.exec(null, null, "Accelerometer", "setTimeout", [frequency + 10000]);
              }
          },
          function(e) { }, "Accelerometer", "getTimeout", []);

      // Start watch timer
      var id = PhoneGap.createUUID();
      navigator.accelerometer.timers[id] = setInterval(function() {
          PhoneGap.exec(successCallback, errorCallback, "Accelerometer", "getAcceleration", []);
      }, (frequency ? frequency : 1));

      return id;
  };

  /**
   * Clears the specified accelerometer watch.
   *
   * @param {String} id       The id of the watch returned from #watchAcceleration.
   */
  Accelerometer.prototype.clearWatch = function(id) {

      // Stop javascript timer & remove from timer list
      if (id && navigator.accelerometer.timers[id] !== undefined) {
          clearInterval(navigator.accelerometer.timers[id]);
          delete navigator.accelerometer.timers[id];
      }
  };

  PhoneGap.addConstructor(function() {
      if (typeof navigator.accelerometer === "undefined") {
          navigator.accelerometer = new Accelerometer();
      }
  });
  }
  /*
   * PhoneGap is available under *either* the terms of the modified BSD license *or* the
   * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
   *
   * Copyright (c) 2005-2010, Nitobi Software Inc.
   * Copyright (c) 2010-2011, IBM Corporation
   */

  if (!PhoneGap.hasResource("app")) {
  PhoneGap.addResource("app");
  (function() {

  /**
   * Constructor
   * @constructor
   */
  var App = function() {};

  /**
   * Clear the resource cache.
   */
  App.prototype.clearCache = function() {
      PhoneGap.exec(null, null, "App", "clearCache", []);
  };

  /**
   * Load the url into the webview.
   *
   * @param url           The URL to load
   * @param props         Properties that can be passed in to the activity:
   *      wait: int                           => wait msec before loading URL
   *      loadingDialog: "Title,Message"      => display a native loading dialog
   *      hideLoadingDialogOnPage: boolean    => hide loadingDialog when page loaded instead of when deviceready event occurs.
   *      loadInWebView: boolean              => cause all links on web page to be loaded into existing web view, instead of being loaded into new browser.
   *      loadUrlTimeoutValue: int            => time in msec to wait before triggering a timeout error
   *      errorUrl: URL                       => URL to load if there's an error loading specified URL with loadUrl().  Should be a local URL such as file:///android_asset/www/error.html");
   *      keepRunning: boolean                => enable app to keep running in background
   *
   * Example:
   *      App app = new App();
   *      app.loadUrl("http://server/myapp/index.html", {wait:2000, loadingDialog:"Wait,Loading App", loadUrlTimeoutValue: 60000});
   */
  App.prototype.loadUrl = function(url, props) {
      PhoneGap.exec(null, null, "App", "loadUrl", [url, props]);
  };

  /**
   * Cancel loadUrl that is waiting to be loaded.
   */
  App.prototype.cancelLoadUrl = function() {
      PhoneGap.exec(null, null, "App", "cancelLoadUrl", []);
  };

  /**
   * Clear web history in this web view.
   * Instead of BACK button loading the previous web page, it will exit the app.
   */
  App.prototype.clearHistory = function() {
      PhoneGap.exec(null, null, "App", "clearHistory", []);
  };

  /**
   * Go to previous page displayed.
   * This is the same as pressing the backbutton on Android device.
   */
  App.prototype.backHistory = function() {
      PhoneGap.exec(null, null, "App", "backHistory", []);
  };

  /**
   * Override the default behavior of the Android back button.
   * If overridden, when the back button is pressed, the "backKeyDown" JavaScript event will be fired.
   *
   * Note: The user should not have to call this method.  Instead, when the user
   *       registers for the "backbutton" event, this is automatically done.
   *
   * @param override		T=override, F=cancel override
   */
  App.prototype.overrideBackbutton = function(override) {
      PhoneGap.exec(null, null, "App", "overrideBackbutton", [override]);
  };

  /**
   * Exit and terminate the application.
   */
  App.prototype.exitApp = function() {
  	return PhoneGap.exec(null, null, "App", "exitApp", []);
  };

  /**
   * Add entry to approved list of URLs (whitelist) that will be loaded into PhoneGap container instead of default browser.
   * 
   * @param origin		URL regular expression to allow
   * @param subdomains	T=include all subdomains under origin
   */
  App.prototype.addWhiteListEntry = function(origin, subdomains) {
  	return PhoneGap.exec(null, null, "App", "addWhiteListEntry", [origin, subdomains]);	
  };

  PhoneGap.addConstructor(function() {
      navigator.app = new App();
      navigator.app.origHistoryBack = window.history.back;
      window.history.back = navigator.app.backHistory;
  });
  }());
  }
  /*
   * PhoneGap is available under *either* the terms of the modified BSD license *or* the
   * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
   *
   * Copyright (c) 2005-2010, Nitobi Software Inc.
   * Copyright (c) 2010-2011, IBM Corporation
   */

  if (!PhoneGap.hasResource("battery")) {
  PhoneGap.addResource("battery");

  /**
   * This class contains information about the current battery status.
   * @constructor
   */
  var Battery = function() {
      this._level = null;
      this._isPlugged = null;
      this._batteryListener = [];
      this._lowListener = [];
      this._criticalListener = [];
  };

  /**
   * Registers as an event producer for battery events.
   * 
   * @param {Object} eventType
   * @param {Object} handler
   * @param {Object} add
   */
  Battery.prototype.eventHandler = function(eventType, handler, add) {
      var me = navigator.battery;
      if (add) {
          // If there are no current registered event listeners start the battery listener on native side.
          if (me._batteryListener.length === 0 && me._lowListener.length === 0 && me._criticalListener.length === 0) {
              PhoneGap.exec(me._status, me._error, "Battery", "start", []);
          }

          // Register the event listener in the proper array
          if (eventType === "batterystatus") {
              var pos = me._batteryListener.indexOf(handler);
              if (pos === -1) {
              	me._batteryListener.push(handler);
              }
          } else if (eventType === "batterylow") {
              var pos = me._lowListener.indexOf(handler);
              if (pos === -1) {
              	me._lowListener.push(handler);
              }
          } else if (eventType === "batterycritical") {
              var pos = me._criticalListener.indexOf(handler);
              if (pos === -1) {
              	me._criticalListener.push(handler);
              }
          }
      } else {
          // Remove the event listener from the proper array
          if (eventType === "batterystatus") {
              var pos = me._batteryListener.indexOf(handler);
              if (pos > -1) {
                  me._batteryListener.splice(pos, 1);        
              }
          } else if (eventType === "batterylow") {
              var pos = me._lowListener.indexOf(handler);
              if (pos > -1) {
                  me._lowListener.splice(pos, 1);        
              }
          } else if (eventType === "batterycritical") {
              var pos = me._criticalListener.indexOf(handler);
              if (pos > -1) {
                  me._criticalListener.splice(pos, 1);        
              }
          }

          // If there are no more registered event listeners stop the battery listener on native side.
          if (me._batteryListener.length === 0 && me._lowListener.length === 0 && me._criticalListener.length === 0) {
              PhoneGap.exec(null, null, "Battery", "stop", []);
          }
      }
  };

  /**
   * Callback for battery status
   * 
   * @param {Object} info			keys: level, isPlugged
   */
  Battery.prototype._status = function(info) {
  	if (info) {
  		var me = this;
  		if (me._level != info.level || me._isPlugged != info.isPlugged) {
  			// Fire batterystatus event
  			PhoneGap.fireWindowEvent("batterystatus", info);

  			// Fire low battery event
  			if (info.level == 20 || info.level == 5) {
  				if (info.level == 20) {
  					PhoneGap.fireWindowEvent("batterylow", info);
  				}
  				else {
  					PhoneGap.fireWindowEvent("batterycritical", info);
  				}
  			}
  		}
  		me._level = info.level;
  		me._isPlugged = info.isPlugged;	
  	}
  };

  /**
   * Error callback for battery start
   */
  Battery.prototype._error = function(e) {
      console.log("Error initializing Battery: " + e);
  };

  PhoneGap.addConstructor(function() {
      if (typeof navigator.battery === "undefined") {
          navigator.battery = new Battery();
          PhoneGap.addWindowEventHandler("batterystatus", navigator.battery.eventHandler);
          PhoneGap.addWindowEventHandler("batterylow", navigator.battery.eventHandler);
          PhoneGap.addWindowEventHandler("batterycritical", navigator.battery.eventHandler);
      }
  });
  }
  /*
   * PhoneGap is available under *either* the terms of the modified BSD license *or* the
   * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
   *
   * Copyright (c) 2005-2010, Nitobi Software Inc.
   * Copyright (c) 2010-2011, IBM Corporation
   */

  if (!PhoneGap.hasResource("camera")) {
  PhoneGap.addResource("camera");

  /**
   * This class provides access to the device camera.
   *
   * @constructor
   */
  var Camera = function() {
      this.successCallback = null;
      this.errorCallback = null;
      this.options = null;
  };

  /**
   * Format of image that returned from getPicture.
   *
   * Example: navigator.camera.getPicture(success, fail,
   *              { quality: 80,
   *                destinationType: Camera.DestinationType.DATA_URL,
   *                sourceType: Camera.PictureSourceType.PHOTOLIBRARY})
   */
  Camera.DestinationType = {
      DATA_URL: 0,                // Return base64 encoded string
      FILE_URI: 1                 // Return file uri (content://media/external/images/media/2 for Android)
  };
  Camera.prototype.DestinationType = Camera.DestinationType;

  /**
   * Encoding of image returned from getPicture.
   *
   * Example: navigator.camera.getPicture(success, fail,
   *              { quality: 80,
   *                destinationType: Camera.DestinationType.DATA_URL,
   *                sourceType: Camera.PictureSourceType.CAMERA,
   *                encodingType: Camera.EncodingType.PNG})
  */
  Camera.EncodingType = {
      JPEG: 0,                    // Return JPEG encoded image
      PNG: 1                      // Return PNG encoded image
  };
  Camera.prototype.EncodingType = Camera.EncodingType;

  /**
   * Type of pictures to select from.  Only applicable when
   *      PictureSourceType is PHOTOLIBRARY or SAVEDPHOTOALBUM
   *
   * Example: navigator.camera.getPicture(success, fail,
   *              { quality: 80,
   *                destinationType: Camera.DestinationType.DATA_URL,
   *                sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
   *                mediaType: Camera.MediaType.PICTURE})
   */
  Camera.MediaType = {
         PICTURE: 0,      // allow selection of still pictures only. DEFAULT. Will return format specified via DestinationType
         VIDEO: 1,        // allow selection of video only, ONLY RETURNS URL
         ALLMEDIA : 2     // allow selection from all media types
  };
  Camera.prototype.MediaType = Camera.MediaType;


  /**
   * Source to getPicture from.
   *
   * Example: navigator.camera.getPicture(success, fail,
   *              { quality: 80,
   *                destinationType: Camera.DestinationType.DATA_URL,
   *                sourceType: Camera.PictureSourceType.PHOTOLIBRARY})
   */
  Camera.PictureSourceType = {
      PHOTOLIBRARY : 0,           // Choose image from picture library (same as SAVEDPHOTOALBUM for Android)
      CAMERA : 1,                 // Take picture from camera
      SAVEDPHOTOALBUM : 2         // Choose image from picture library (same as PHOTOLIBRARY for Android)
  };
  Camera.prototype.PictureSourceType = Camera.PictureSourceType;

  /**
   * Gets a picture from source defined by "options.sourceType", and returns the
   * image as defined by the "options.destinationType" option.

   * The defaults are sourceType=CAMERA and destinationType=DATA_URL.
   *
   * @param {Function} successCallback
   * @param {Function} errorCallback
   * @param {Object} options
   */
  Camera.prototype.getPicture = function(successCallback, errorCallback, options) {

      // successCallback required
      if (typeof successCallback !== "function") {
          console.log("Camera Error: successCallback is not a function");
          return;
      }

      // errorCallback optional
      if (errorCallback && (typeof errorCallback !== "function")) {
          console.log("Camera Error: errorCallback is not a function");
          return;
      }

      if (options === null || typeof options === "undefined") {
          options = {};
      }
      if (options.quality === null || typeof options.quality === "undefined") {
          options.quality = 80;
      }
      if (options.maxResolution === null || typeof options.maxResolution === "undefined") {
      	options.maxResolution = 0;
      }
      if (options.destinationType === null || typeof options.destinationType === "undefined") {
          options.destinationType = Camera.DestinationType.DATA_URL;
      }
      if (options.sourceType === null || typeof options.sourceType === "undefined") {
          options.sourceType = Camera.PictureSourceType.CAMERA;
      }
      if (options.encodingType === null || typeof options.encodingType === "undefined") {
          options.encodingType = Camera.EncodingType.JPEG;
      }
      if (options.mediaType === null || typeof options.mediaType === "undefined") {
          options.mediaType = Camera.MediaType.PICTURE;
      }
      if (options.targetWidth === null || typeof options.targetWidth === "undefined") {
          options.targetWidth = -1;
      } 
      else if (typeof options.targetWidth == "string") {
          var width = new Number(options.targetWidth);
          if (isNaN(width) === false) {
              options.targetWidth = width.valueOf();
          }
      }
      if (options.targetHeight === null || typeof options.targetHeight === "undefined") {
          options.targetHeight = -1;
      } 
      else if (typeof options.targetHeight == "string") {
          var height = new Number(options.targetHeight);
          if (isNaN(height) === false) {
              options.targetHeight = height.valueOf();
          }
      }

      PhoneGap.exec(successCallback, errorCallback, "Camera", "takePicture", [options]);
  };

  PhoneGap.addConstructor(function() {
      if (typeof navigator.camera === "undefined") {
          navigator.camera = new Camera();
      }
  });
  }
  /*
   * PhoneGap is available under *either* the terms of the modified BSD license *or* the
   * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
   *
   * Copyright (c) 2005-2010, Nitobi Software Inc.
   * Copyright (c) 2010-2011, IBM Corporation
   */

  if (!PhoneGap.hasResource("capture")) {
  PhoneGap.addResource("capture");

  /**
   * Represents a single file.
   *
   * name {DOMString} name of the file, without path information
   * fullPath {DOMString} the full path of the file, including the name
   * type {DOMString} mime type
   * lastModifiedDate {Date} last modified date
   * size {Number} size of the file in bytes
   */
  var MediaFile = function(name, fullPath, type, lastModifiedDate, size){
  	this.name = name || null;
  	this.fullPath = fullPath || null;
  	this.type = type || null;
  	this.lastModifiedDate = lastModifiedDate || null;
  	this.size = size || 0;
  };

  /**
   * Launch device camera application for recording video(s).
   *
   * @param {Function} successCB
   * @param {Function} errorCB
   */
  MediaFile.prototype.getFormatData = function(successCallback, errorCallback){
  	PhoneGap.exec(successCallback, errorCallback, "Capture", "getFormatData", [this.fullPath, this.type]);
  };

  /**
   * MediaFileData encapsulates format information of a media file.
   *
   * @param {DOMString} codecs
   * @param {long} bitrate
   * @param {long} height
   * @param {long} width
   * @param {float} duration
   */
  var MediaFileData = function(codecs, bitrate, height, width, duration){
  	this.codecs = codecs || null;
  	this.bitrate = bitrate || 0;
  	this.height = height || 0;
  	this.width = width || 0;
  	this.duration = duration || 0;
  };

  /**
   * The CaptureError interface encapsulates all errors in the Capture API.
   */
  var CaptureError = function(){
  	this.code = null;
  };

  // Capture error codes
  CaptureError.CAPTURE_INTERNAL_ERR = 0;
  CaptureError.CAPTURE_APPLICATION_BUSY = 1;
  CaptureError.CAPTURE_INVALID_ARGUMENT = 2;
  CaptureError.CAPTURE_NO_MEDIA_FILES = 3;
  CaptureError.CAPTURE_NOT_SUPPORTED = 20;

  /**
   * The Capture interface exposes an interface to the camera and microphone of the hosting device.
   */
  var Capture = function(){
  	this.supportedAudioModes = [];
  	this.supportedImageModes = [];
  	this.supportedVideoModes = [];
  };

  /**
   * Launch audio recorder application for recording audio clip(s).
   *
   * @param {Function} successCB
   * @param {Function} errorCB
   * @param {CaptureAudioOptions} options
   */
  Capture.prototype.captureAudio = function(successCallback, errorCallback, options){
  	PhoneGap.exec(successCallback, errorCallback, "Capture", "captureAudio", [options]);
  };

  /**
   * Launch camera application for taking image(s).
   *
   * @param {Function} successCB
   * @param {Function} errorCB
   * @param {CaptureImageOptions} options
   */
  Capture.prototype.captureImage = function(successCallback, errorCallback, options){
  	PhoneGap.exec(successCallback, errorCallback, "Capture", "captureImage", [options]);
  };

  /**
   * Launch camera application for taking image(s).
   *
   * @param {Function} successCB
   * @param {Function} errorCB
   * @param {CaptureImageOptions} options
   */
  Capture.prototype._castMediaFile = function(pluginResult){
  	var mediaFiles = [];
  	var i;
  	for (i = 0; i < pluginResult.message.length; i++) {
  		var mediaFile = new MediaFile();
  		mediaFile.name = pluginResult.message[i].name;
  		mediaFile.fullPath = pluginResult.message[i].fullPath;
  		mediaFile.type = pluginResult.message[i].type;
  		mediaFile.lastModifiedDate = pluginResult.message[i].lastModifiedDate;
  		mediaFile.size = pluginResult.message[i].size;
  		mediaFiles.push(mediaFile);
  	}
  	pluginResult.message = mediaFiles;
  	return pluginResult;
  };

  /**
   * Launch device camera application for recording video(s).
   *
   * @param {Function} successCB
   * @param {Function} errorCB
   * @param {CaptureVideoOptions} options
   */
  Capture.prototype.captureVideo = function(successCallback, errorCallback, options){
  	PhoneGap.exec(successCallback, errorCallback, "Capture", "captureVideo", [options]);
  };

  /**
   * Encapsulates a set of parameters that the capture device supports.
   */
  var ConfigurationData = function(){
  	// The ASCII-encoded string in lower case representing the media type. 
  	this.type = null;
  	// The height attribute represents height of the image or video in pixels. 
  	// In the case of a sound clip this attribute has value 0. 
  	this.height = 0;
  	// The width attribute represents width of the image or video in pixels. 
  	// In the case of a sound clip this attribute has value 0
  	this.width = 0;
  };

  /**
   * Encapsulates all image capture operation configuration options.
   */
  var CaptureImageOptions = function(){
  	// Upper limit of images user can take. Value must be equal or greater than 1.
  	this.limit = 1;
  	// The selected image mode. Must match with one of the elements in supportedImageModes array.
  	this.mode = null;
  };

  /**
   * Encapsulates all video capture operation configuration options.
   */
  var CaptureVideoOptions = function(){
  	// Upper limit of videos user can record. Value must be equal or greater than 1.
  	this.limit = 1;
  	// Maximum duration of a single video clip in seconds.
  	this.duration = 0;
  	// The selected video mode. Must match with one of the elements in supportedVideoModes array.
  	this.mode = null;
  };

  /**
   * Encapsulates all audio capture operation configuration options.
   */
  var CaptureAudioOptions = function(){
  	// Upper limit of sound clips user can record. Value must be equal or greater than 1.
  	this.limit = 1;
  	// Maximum duration of a single sound clip in seconds.
  	this.duration = 0;
  	// The selected audio mode. Must match with one of the elements in supportedAudioModes array.
  	this.mode = null;
  };

  PhoneGap.addConstructor(function(){
  	if (typeof navigator.device === "undefined") {
  		navigator.device = window.device = new Device();
  	}
  	if (typeof navigator.device.capture === "undefined") {
  		navigator.device.capture = window.device.capture = new Capture();
  	}
  });
  }/*
   * PhoneGap is available under *either* the terms of the modified BSD license *or* the
   * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
   *
   * Copyright (c) 2005-2010, Nitobi Software Inc.
   * Copyright (c) 2010-2011, IBM Corporation
   */

  if (!PhoneGap.hasResource("compass")) {
  PhoneGap.addResource("compass");

  CompassError = function(){
      this.code = null;
  };

  // Capture error codes
  CompassError.COMPASS_INTERNAL_ERR = 0;
  CompassError.COMPASS_NOT_SUPPORTED = 20;

  CompassHeading = function() {
      this.magneticHeading = null;
      this.trueHeading = null;
      this.headingAccuracy = null;
      this.timestamp = null;
  };

  /**
   * This class provides access to device Compass data.
   * @constructor
   */
  var Compass = function() {
      /**
       * The last known Compass position.
       */
      this.lastHeading = null;

      /**
       * List of compass watch timers
       */
      this.timers = {};
  };

  Compass.ERROR_MSG = ["Not running", "Starting", "", "Failed to start"];

  /**
   * Asynchronously aquires the current heading.
   *
   * @param {Function} successCallback The function to call when the heading data is available
   * @param {Function} errorCallback The function to call when there is an error getting the heading data. (OPTIONAL)
   * @param {PositionOptions} options The options for getting the heading data such as timeout. (OPTIONAL)
   */
  Compass.prototype.getCurrentHeading = function(successCallback, errorCallback, options) {

      // successCallback required
      if (typeof successCallback !== "function") {
          console.log("Compass Error: successCallback is not a function");
          return;
      }

      // errorCallback optional
      if (errorCallback && (typeof errorCallback !== "function")) {
          console.log("Compass Error: errorCallback is not a function");
          return;
      }

      // Get heading
      PhoneGap.exec(successCallback, errorCallback, "Compass", "getHeading", []);
  };

  /**
   * Asynchronously aquires the heading repeatedly at a given interval.
   *
   * @param {Function} successCallback    The function to call each time the heading data is available
   * @param {Function} errorCallback      The function to call when there is an error getting the heading data. (OPTIONAL)
   * @param {HeadingOptions} options      The options for getting the heading data such as timeout and the frequency of the watch. (OPTIONAL)
   * @return String                       The watch id that must be passed to #clearWatch to stop watching.
   */
  Compass.prototype.watchHeading= function(successCallback, errorCallback, options) {

      // Default interval (100 msec)
      var frequency = (options !== undefined) ? options.frequency : 100;

      // successCallback required
      if (typeof successCallback !== "function") {
          console.log("Compass Error: successCallback is not a function");
          return;
      }

      // errorCallback optional
      if (errorCallback && (typeof errorCallback !== "function")) {
          console.log("Compass Error: errorCallback is not a function");
          return;
      }

      // Make sure compass timeout > frequency + 10 sec
      PhoneGap.exec(
          function(timeout) {
              if (timeout < (frequency + 10000)) {
                  PhoneGap.exec(null, null, "Compass", "setTimeout", [frequency + 10000]);
              }
          },
          function(e) { }, "Compass", "getTimeout", []);

      // Start watch timer to get headings
      var id = PhoneGap.createUUID();
      navigator.compass.timers[id] = setInterval(
          function() {
              PhoneGap.exec(successCallback, errorCallback, "Compass", "getHeading", []);
          }, (frequency ? frequency : 1));

      return id;
  };


  /**
   * Clears the specified heading watch.
   *
   * @param {String} id       The ID of the watch returned from #watchHeading.
   */
  Compass.prototype.clearWatch = function(id) {

      // Stop javascript timer & remove from timer list
      if (id && navigator.compass.timers[id]) {
          clearInterval(navigator.compass.timers[id]);
          delete navigator.compass.timers[id];
      }
  };

  Compass.prototype._castDate = function(pluginResult) {
      if (pluginResult.message.timestamp) {
          var timestamp = new Date(pluginResult.message.timestamp);
          pluginResult.message.timestamp = timestamp;
      }
      return pluginResult;
  };

  PhoneGap.addConstructor(function() {
      if (typeof navigator.compass === "undefined") {
          navigator.compass = new Compass();
      }
  });
  }
  /*
   * PhoneGap is available under *either* the terms of the modified BSD license *or* the
   * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
   *
   * Copyright (c) 2005-2010, Nitobi Software Inc.
   * Copyright (c) 2010-2011, IBM Corporation
   */

  if (!PhoneGap.hasResource("contact")) {
  PhoneGap.addResource("contact");

  /**
  * Contains information about a single contact.
  * @constructor
  * @param {DOMString} id unique identifier
  * @param {DOMString} displayName
  * @param {ContactName} name
  * @param {DOMString} nickname
  * @param {Array.<ContactField>} phoneNumbers array of phone numbers
  * @param {Array.<ContactField>} emails array of email addresses
  * @param {Array.<ContactAddress>} addresses array of addresses
  * @param {Array.<ContactField>} ims instant messaging user ids
  * @param {Array.<ContactOrganization>} organizations
  * @param {DOMString} birthday contact's birthday
  * @param {DOMString} note user notes about contact
  * @param {Array.<ContactField>} photos
  * @param {Array.<ContactField>} categories
  * @param {Array.<ContactField>} urls contact's web sites
  */
  var Contact = function (id, displayName, name, nickname, phoneNumbers, emails, addresses,
      ims, organizations, birthday, note, photos, categories, urls) {
      this.id = id || null;
      this.rawId = null;
      this.displayName = displayName || null;
      this.name = name || null; // ContactName
      this.nickname = nickname || null;
      this.phoneNumbers = phoneNumbers || null; // ContactField[]
      this.emails = emails || null; // ContactField[]
      this.addresses = addresses || null; // ContactAddress[]
      this.ims = ims || null; // ContactField[]
      this.organizations = organizations || null; // ContactOrganization[]
      this.birthday = birthday || null;
      this.note = note || null;
      this.photos = photos || null; // ContactField[]
      this.categories = categories || null; // ContactField[]
      this.urls = urls || null; // ContactField[]
  };

  /**
   *  ContactError.
   *  An error code assigned by an implementation when an error has occurreds
   * @constructor
   */
  var ContactError = function() {
      this.code=null;
  };

  /**
   * Error codes
   */
  ContactError.UNKNOWN_ERROR = 0;
  ContactError.INVALID_ARGUMENT_ERROR = 1;
  ContactError.TIMEOUT_ERROR = 2;
  ContactError.PENDING_OPERATION_ERROR = 3;
  ContactError.IO_ERROR = 4;
  ContactError.NOT_SUPPORTED_ERROR = 5;
  ContactError.PERMISSION_DENIED_ERROR = 20;

  /**
  * Removes contact from device storage.
  * @param successCB success callback
  * @param errorCB error callback
  */
  Contact.prototype.remove = function(successCB, errorCB) {
      if (this.id === null) {
          var errorObj = new ContactError();
          errorObj.code = ContactError.UNKNOWN_ERROR;
          errorCB(errorObj);
      }
      else {
          PhoneGap.exec(successCB, errorCB, "Contacts", "remove", [this.id]);
      }
  };

  /**
  * Creates a deep copy of this Contact.
  * With the contact ID set to null.
  * @return copy of this Contact
  */
  Contact.prototype.clone = function() {
      var clonedContact = PhoneGap.clone(this);
      var i;
      clonedContact.id = null;
      clonedContact.rawId = null;
      // Loop through and clear out any id's in phones, emails, etc.
      if (clonedContact.phoneNumbers) {
          for (i = 0; i < clonedContact.phoneNumbers.length; i++) {
              clonedContact.phoneNumbers[i].id = null;
          }
      }
      if (clonedContact.emails) {
          for (i = 0; i < clonedContact.emails.length; i++) {
              clonedContact.emails[i].id = null;
          }
      }
      if (clonedContact.addresses) {
          for (i = 0; i < clonedContact.addresses.length; i++) {
              clonedContact.addresses[i].id = null;
          }
      }
      if (clonedContact.ims) {
          for (i = 0; i < clonedContact.ims.length; i++) {
              clonedContact.ims[i].id = null;
          }
      }
      if (clonedContact.organizations) {
          for (i = 0; i < clonedContact.organizations.length; i++) {
              clonedContact.organizations[i].id = null;
          }
      }
      if (clonedContact.tags) {
          for (i = 0; i < clonedContact.tags.length; i++) {
              clonedContact.tags[i].id = null;
          }
      }
      if (clonedContact.photos) {
          for (i = 0; i < clonedContact.photos.length; i++) {
              clonedContact.photos[i].id = null;
          }
      }
      if (clonedContact.urls) {
          for (i = 0; i < clonedContact.urls.length; i++) {
              clonedContact.urls[i].id = null;
          }
      }
      return clonedContact;
  };

  /**
  * Persists contact to device storage.
  * @param successCB success callback
  * @param errorCB error callback
  */
  Contact.prototype.save = function(successCB, errorCB) {
      PhoneGap.exec(successCB, errorCB, "Contacts", "save", [this]);
  };

  /**
  * Contact name.
  * @constructor
  * @param formatted
  * @param familyName
  * @param givenName
  * @param middle
  * @param prefix
  * @param suffix
  */
  var ContactName = function(formatted, familyName, givenName, middle, prefix, suffix) {
      this.formatted = formatted || null;
      this.familyName = familyName || null;
      this.givenName = givenName || null;
      this.middleName = middle || null;
      this.honorificPrefix = prefix || null;
      this.honorificSuffix = suffix || null;
  };

  /**
  * Generic contact field.
  * @constructor
  * @param {DOMString} id unique identifier, should only be set by native code
  * @param type
  * @param value
  * @param pref
  */
  var ContactField = function(type, value, pref) {
  	this.id = null;
      this.type = type || null;
      this.value = value || null;
      this.pref = pref || null;
  };

  /**
  * Contact address.
  * @constructor
  * @param {DOMString} id unique identifier, should only be set by native code
  * @param formatted
  * @param streetAddress
  * @param locality
  * @param region
  * @param postalCode
  * @param country
  */
  var ContactAddress = function(pref, type, formatted, streetAddress, locality, region, postalCode, country) {
  	this.id = null;
      this.pref = pref || null;
      this.type = type || null;
      this.formatted = formatted || null;
      this.streetAddress = streetAddress || null;
      this.locality = locality || null;
      this.region = region || null;
      this.postalCode = postalCode || null;
      this.country = country || null;
  };

  /**
  * Contact organization.
  * @constructor
  * @param {DOMString} id unique identifier, should only be set by native code
  * @param name
  * @param dept
  * @param title
  * @param startDate
  * @param endDate
  * @param location
  * @param desc
  */
  var ContactOrganization = function(pref, type, name, dept, title) {
  	this.id = null;
      this.pref = pref || null;
      this.type = type || null;
      this.name = name || null;
      this.department = dept || null;
      this.title = title || null;
  };

  /**
  * Represents a group of Contacts.
  * @constructor
  */
  var Contacts = function() {
      this.inProgress = false;
      this.records = [];
  };
  /**
  * Returns an array of Contacts matching the search criteria.
  * @param fields that should be searched
  * @param successCB success callback
  * @param errorCB error callback
  * @param {ContactFindOptions} options that can be applied to contact searching
  * @return array of Contacts matching search criteria
  */
  Contacts.prototype.find = function(fields, successCB, errorCB, options) {
      if (successCB === null) {
          throw new TypeError("You must specify a success callback for the find command.");
      }
      if (fields === null || fields === "undefined" || fields.length === "undefined" || fields.length <= 0) {
          if (typeof errorCB === "function") {
              errorCB({"code": ContactError.INVALID_ARGUMENT_ERROR});
          }
      } else {
          PhoneGap.exec(successCB, errorCB, "Contacts", "search", [fields, options]);        
      }
  };

  /**
  * This function creates a new contact, but it does not persist the contact
  * to device storage. To persist the contact to device storage, invoke
  * contact.save().
  * @param properties an object who's properties will be examined to create a new Contact
  * @returns new Contact object
  */
  Contacts.prototype.create = function(properties) {
      var i;
  	var contact = new Contact();
      for (i in properties) {
          if (contact[i] !== 'undefined') {
              contact[i] = properties[i];
          }
      }
      return contact;
  };

  /**
  * This function returns and array of contacts.  It is required as we need to convert raw
  * JSON objects into concrete Contact objects.  Currently this method is called after
  * navigator.contacts.find but before the find methods success call back.
  *
  * @param jsonArray an array of JSON Objects that need to be converted to Contact objects.
  * @returns an array of Contact objects
  */
  Contacts.prototype.cast = function(pluginResult) {
  	var contacts = [];
  	var i;
  	for (i=0; i<pluginResult.message.length; i++) {
  		contacts.push(navigator.contacts.create(pluginResult.message[i]));
  	}
  	pluginResult.message = contacts;
  	return pluginResult;
  };

  /**
   * ContactFindOptions.
   * @constructor
   * @param filter used to match contacts against
   * @param multiple boolean used to determine if more than one contact should be returned
   */
  var ContactFindOptions = function(filter, multiple) {
      this.filter = filter || '';
      this.multiple = multiple || false;
  };

  /**
   * Add the contact interface into the browser.
   */
  PhoneGap.addConstructor(function() {
      if(typeof navigator.contacts === "undefined") {
          navigator.contacts = new Contacts();
      }
  });
  }
  /*
   * PhoneGap is available under *either* the terms of the modified BSD license *or* the
   * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
   *
   * Copyright (c) 2005-2010, Nitobi Software Inc.
   * Copyright (c) 2010-2011, IBM Corporation
   */

  // TODO: Needs to be commented

  if (!PhoneGap.hasResource("crypto")) {
  PhoneGap.addResource("crypto");

  /**
  * @constructor
  */
  var Crypto = function() {
  };

  Crypto.prototype.encrypt = function(seed, string, callback) {
      this.encryptWin = callback;
      PhoneGap.exec(null, null, "Crypto", "encrypt", [seed, string]);
  };

  Crypto.prototype.decrypt = function(seed, string, callback) {
      this.decryptWin = callback;
      PhoneGap.exec(null, null, "Crypto", "decrypt", [seed, string]);
  };

  Crypto.prototype.gotCryptedString = function(string) {
      this.encryptWin(string);
  };

  Crypto.prototype.getPlainString = function(string) {
      this.decryptWin(string);
  };

  PhoneGap.addConstructor(function() {
      if (typeof navigator.Crypto === "undefined") {
          navigator.Crypto = new Crypto();
      }
  });
  }
  /*
   * PhoneGap is available under *either* the terms of the modified BSD license *or* the
   * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
   *
   * Copyright (c) 2005-2010, Nitobi Software Inc.
   * Copyright (c) 2010-2011, IBM Corporation
   */

  if (!PhoneGap.hasResource("device")) {
  PhoneGap.addResource("device");

  /**
   * This represents the mobile device, and provides properties for inspecting the model, version, UUID of the
   * phone, etc.
   * @constructor
   */
  var Device = function() {
      this.available = PhoneGap.available;
      this.platform = null;
      this.version = null;
      this.name = null;
      this.uuid = null;
      this.phonegap = null;

      var me = this;
      this.getInfo(
          function(info) {
              me.available = true;
              me.platform = info.platform;
              me.version = info.version;
              me.name = info.name;
              me.uuid = info.uuid;
              me.phonegap = info.phonegap;
              PhoneGap.onPhoneGapInfoReady.fire();
          },
          function(e) {
              me.available = false;
              console.log("Error initializing PhoneGap: " + e);
              alert("Error initializing PhoneGap: "+e);
          });
  };

  /**
   * Get device info
   *
   * @param {Function} successCallback The function to call when the heading data is available
   * @param {Function} errorCallback The function to call when there is an error getting the heading data. (OPTIONAL)
   */
  Device.prototype.getInfo = function(successCallback, errorCallback) {

      // successCallback required
      if (typeof successCallback !== "function") {
          console.log("Device Error: successCallback is not a function");
          return;
      }

      // errorCallback optional
      if (errorCallback && (typeof errorCallback !== "function")) {
          console.log("Device Error: errorCallback is not a function");
          return;
      }

      // Get info
      PhoneGap.exec(successCallback, errorCallback, "Device", "getDeviceInfo", []);
  };

  /*
   * DEPRECATED
   * This is only for Android.
   *
   * You must explicitly override the back button.
   */
  Device.prototype.overrideBackButton = function() {
  	console.log("Device.overrideBackButton() is deprecated.  Use App.overrideBackbutton(true).");
  	navigator.app.overrideBackbutton(true);
  };

  /*
   * DEPRECATED
   * This is only for Android.
   *
   * This resets the back button to the default behaviour
   */
  Device.prototype.resetBackButton = function() {
  	console.log("Device.resetBackButton() is deprecated.  Use App.overrideBackbutton(false).");
  	navigator.app.overrideBackbutton(false);
  };

  /*
   * DEPRECATED
   * This is only for Android.
   *
   * This terminates the activity!
   */
  Device.prototype.exitApp = function() {
  	console.log("Device.exitApp() is deprecated.  Use App.exitApp().");
  	navigator.app.exitApp();
  };

  PhoneGap.addConstructor(function() {
      if (typeof navigator.device === "undefined") {
          navigator.device = window.device = new Device();
      }
  });
  }
  /*
   * PhoneGap is available under *either* the terms of the modified BSD license *or* the
   * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
   *
   * Copyright (c) 2005-2010, Nitobi Software Inc.
   * Copyright (c) 2010-2011, IBM Corporation
   */

  if (!PhoneGap.hasResource("file")) {
  PhoneGap.addResource("file");

  /**
   * This class provides some useful information about a file.
   * @constructor
   */
  var FileProperties = function(filePath) {
      this.filePath = filePath;
      this.size = 0;
      this.lastModifiedDate = null;
  };

  /**
   * Represents a single file.
   *
   * @constructor
   * @param name {DOMString} name of the file, without path information
   * @param fullPath {DOMString} the full path of the file, including the name
   * @param type {DOMString} mime type
   * @param lastModifiedDate {Date} last modified date
   * @param size {Number} size of the file in bytes
   */
  var File = function(name, fullPath, type, lastModifiedDate, size) {
      this.name = name || null;
      this.fullPath = fullPath || null;
      this.type = type || null;
      this.lastModifiedDate = lastModifiedDate || null;
      this.size = size || 0;
  };

  /** @constructor */
  var FileError = function() {
     this.code = null;
  };

  // File error codes
  // Found in DOMException
  FileError.NOT_FOUND_ERR = 1;
  FileError.SECURITY_ERR = 2;
  FileError.ABORT_ERR = 3;

  // Added by this specification
  FileError.NOT_READABLE_ERR = 4;
  FileError.ENCODING_ERR = 5;
  FileError.NO_MODIFICATION_ALLOWED_ERR = 6;
  FileError.INVALID_STATE_ERR = 7;
  FileError.SYNTAX_ERR = 8;
  FileError.INVALID_MODIFICATION_ERR = 9;
  FileError.QUOTA_EXCEEDED_ERR = 10;
  FileError.TYPE_MISMATCH_ERR = 11;
  FileError.PATH_EXISTS_ERR = 12;

  //-----------------------------------------------------------------------------
  // File Reader
  //-----------------------------------------------------------------------------

  /**
   * This class reads the mobile device file system.
   *
   * For Android:
   *      The root directory is the root of the file system.
   *      To read from the SD card, the file name is "sdcard/my_file.txt"
   * @constructor
   */
  var FileReader = function() {
      this.fileName = "";

      this.readyState = 0;

      // File data
      this.result = null;

      // Error
      this.error = null;

      // Event handlers
      this.onloadstart = null;    // When the read starts.
      this.onprogress = null;     // While reading (and decoding) file or fileBlob data, and reporting partial file data (progess.loaded/progress.total)
      this.onload = null;         // When the read has successfully completed.
      this.onerror = null;        // When the read has failed (see errors).
      this.onloadend = null;      // When the request has completed (either in success or failure).
      this.onabort = null;        // When the read has been aborted. For instance, by invoking the abort() method.
  };

  // States
  FileReader.EMPTY = 0;
  FileReader.LOADING = 1;
  FileReader.DONE = 2;

  /**
   * Abort reading file.
   */
  FileReader.prototype.abort = function() {
      var evt;
      this.readyState = FileReader.DONE;
      this.result = null;

      // set error
      var error = new FileError();
      error.code = error.ABORT_ERR;
      this.error = error;

      // If error callback
      if (typeof this.onerror === "function") {
          this.onerror({"type":"error", "target":this});
      }
      // If abort callback
      if (typeof this.onabort === "function") {
          this.onabort({"type":"abort", "target":this});
      }
      // If load end callback
      if (typeof this.onloadend === "function") {
          this.onloadend({"type":"loadend", "target":this});
      }
  };

  /**
   * Read text file.
   *
   * @param file          {File} File object containing file properties
   * @param encoding      [Optional] (see http://www.iana.org/assignments/character-sets)
   */
  FileReader.prototype.readAsText = function(file, encoding) {
      this.fileName = "";
      if (typeof file.fullPath === "undefined") {
          this.fileName = file;
      } else {
          this.fileName = file.fullPath;
      }

      // LOADING state
      this.readyState = FileReader.LOADING;

      // If loadstart callback
      if (typeof this.onloadstart === "function") {
          this.onloadstart({"type":"loadstart", "target":this});
      }

      // Default encoding is UTF-8
      var enc = encoding ? encoding : "UTF-8";

      var me = this;

      // Read file
      PhoneGap.exec(
          // Success callback
          function(r) {
              var evt;

              // If DONE (cancelled), then don't do anything
              if (me.readyState === FileReader.DONE) {
                  return;
              }

              // Save result
              me.result = r;

              // If onload callback
              if (typeof me.onload === "function") {
                  me.onload({"type":"load", "target":me});
              }

              // DONE state
              me.readyState = FileReader.DONE;

              // If onloadend callback
              if (typeof me.onloadend === "function") {
                  me.onloadend({"type":"loadend", "target":me});
              }
          },
          // Error callback
          function(e) {
              var evt;
              // If DONE (cancelled), then don't do anything
              if (me.readyState === FileReader.DONE) {
                  return;
              }

              // Save error
              me.error = e;

              // If onerror callback
              if (typeof me.onerror === "function") {
                  me.onerror({"type":"error", "target":me});
              }

              // DONE state
              me.readyState = FileReader.DONE;

              // If onloadend callback
              if (typeof me.onloadend === "function") {
                  me.onloadend({"type":"loadend", "target":me});
              }
          }, "File", "readAsText", [this.fileName, enc]);
  };


  /**
   * Read file and return data as a base64 encoded data url.
   * A data url is of the form:
   *      data:[<mediatype>][;base64],<data>
   *
   * @param file          {File} File object containing file properties
   */
  FileReader.prototype.readAsDataURL = function(file) {
      this.fileName = "";
      if (typeof file.fullPath === "undefined") {
          this.fileName = file;
      } else {
          this.fileName = file.fullPath;
      }

      // LOADING state
      this.readyState = FileReader.LOADING;

      // If loadstart callback
      if (typeof this.onloadstart === "function") {
          this.onloadstart({"type":"loadstart", "target":this});
      }

      var me = this;

      // Read file
      PhoneGap.exec(
          // Success callback
          function(r) {
              var evt;

              // If DONE (cancelled), then don't do anything
              if (me.readyState === FileReader.DONE) {
                  return;
              }

              // Save result
              me.result = r;

              // If onload callback
              if (typeof me.onload === "function") {
                  me.onload({"type":"load", "target":me});
              }

              // DONE state
              me.readyState = FileReader.DONE;

              // If onloadend callback
              if (typeof me.onloadend === "function") {
                  me.onloadend({"type":"loadend", "target":me});
              }
          },
          // Error callback
          function(e) {
              var evt;
              // If DONE (cancelled), then don't do anything
              if (me.readyState === FileReader.DONE) {
                  return;
              }

              // Save error
              me.error = e;

              // If onerror callback
              if (typeof me.onerror === "function") {
                  me.onerror({"type":"error", "target":me});
              }

              // DONE state
              me.readyState = FileReader.DONE;

              // If onloadend callback
              if (typeof me.onloadend === "function") {
                  me.onloadend({"type":"loadend", "target":me});
              }
          }, "File", "readAsDataURL", [this.fileName]);
  };

  /**
   * Read file and return data as a binary data.
   *
   * @param file          {File} File object containing file properties
   */
  FileReader.prototype.readAsBinaryString = function(file) {
      // TODO - Can't return binary data to browser.
      this.fileName = file;
  };

  /**
   * Read file and return data as a binary data.
   *
   * @param file          {File} File object containing file properties
   */
  FileReader.prototype.readAsArrayBuffer = function(file) {
      // TODO - Can't return binary data to browser.
      this.fileName = file;
  };

  //-----------------------------------------------------------------------------
  // File Writer
  //-----------------------------------------------------------------------------

  /**
   * This class writes to the mobile device file system.
   *
   * For Android:
   *      The root directory is the root of the file system.
   *      To write to the SD card, the file name is "sdcard/my_file.txt"
   *
   * @constructor
   * @param file {File} File object containing file properties
   * @param append if true write to the end of the file, otherwise overwrite the file
   */
  var FileWriter = function(file) {
      this.fileName = "";
      this.length = 0;
      if (file) {
          this.fileName = file.fullPath || file;
          this.length = file.size || 0;
      }
      // default is to write at the beginning of the file
      this.position = 0;

      this.readyState = 0; // EMPTY

      this.result = null;

      // Error
      this.error = null;

      // Event handlers
      this.onwritestart = null;   // When writing starts
      this.onprogress = null;     // While writing the file, and reporting partial file data
      this.onwrite = null;        // When the write has successfully completed.
      this.onwriteend = null;     // When the request has completed (either in success or failure).
      this.onabort = null;        // When the write has been aborted. For instance, by invoking the abort() method.
      this.onerror = null;        // When the write has failed (see errors).
  };

  // States
  FileWriter.INIT = 0;
  FileWriter.WRITING = 1;
  FileWriter.DONE = 2;

  /**
   * Abort writing file.
   */
  FileWriter.prototype.abort = function() {
      // check for invalid state
      if (this.readyState === FileWriter.DONE || this.readyState === FileWriter.INIT) {
          throw FileError.INVALID_STATE_ERR;
      }

      // set error
      var error = new FileError(), evt;
      error.code = error.ABORT_ERR;
      this.error = error;

      // If error callback
      if (typeof this.onerror === "function") {
          this.onerror({"type":"error", "target":this});
      }
      // If abort callback
      if (typeof this.onabort === "function") {
          this.onabort({"type":"abort", "target":this});
      }

      this.readyState = FileWriter.DONE;

      // If write end callback
      if (typeof this.onwriteend == "function") {
          this.onwriteend({"type":"writeend", "target":this});
      }
  };

  /**
   * Writes data to the file
   *
   * @param text to be written
   */
  FileWriter.prototype.write = function(text) {
      // Throw an exception if we are already writing a file
      if (this.readyState === FileWriter.WRITING) {
          throw FileError.INVALID_STATE_ERR;
      }

      // WRITING state
      this.readyState = FileWriter.WRITING;

      var me = this;

      // If onwritestart callback
      if (typeof me.onwritestart === "function") {
          me.onwritestart({"type":"writestart", "target":me});
      }

      // Write file
      PhoneGap.exec(
          // Success callback
          function(r) {
              var evt;
              // If DONE (cancelled), then don't do anything
              if (me.readyState === FileWriter.DONE) {
                  return;
              }

              // position always increases by bytes written because file would be extended
              me.position += r;
              // The length of the file is now where we are done writing.
              me.length = me.position;

              // If onwrite callback
              if (typeof me.onwrite === "function") {
                  me.onwrite({"type":"write", "target":me});
              }

              // DONE state
              me.readyState = FileWriter.DONE;

              // If onwriteend callback
              if (typeof me.onwriteend === "function") {
                  me.onwriteend({"type":"writeend", "target":me});
              }
          },
          // Error callback
          function(e) {
              var evt;

              // If DONE (cancelled), then don't do anything
              if (me.readyState === FileWriter.DONE) {
                  return;
              }

              // Save error
              me.error = e;

              // If onerror callback
              if (typeof me.onerror === "function") {
                  me.onerror({"type":"error", "target":me});
              }

              // DONE state
              me.readyState = FileWriter.DONE;

              // If onwriteend callback
              if (typeof me.onwriteend === "function") {
                  me.onwriteend({"type":"writeend", "target":me});
              }
          }, "File", "write", [this.fileName, text, this.position]);
  };

  /**
   * Moves the file pointer to the location specified.
   *
   * If the offset is a negative number the position of the file
   * pointer is rewound.  If the offset is greater than the file
   * size the position is set to the end of the file.
   *
   * @param offset is the location to move the file pointer to.
   */
  FileWriter.prototype.seek = function(offset) {
      // Throw an exception if we are already writing a file
      if (this.readyState === FileWriter.WRITING) {
          throw FileError.INVALID_STATE_ERR;
      }

      if (!offset) {
          return;
      }

      // See back from end of file.
      if (offset < 0) {
          this.position = Math.max(offset + this.length, 0);
      }
      // Offset is bigger then file size so set position
      // to the end of the file.
      else if (offset > this.length) {
          this.position = this.length;
      }
      // Offset is between 0 and file size so set the position
      // to start writing.
      else {
          this.position = offset;
      }
  };

  /**
   * Truncates the file to the size specified.
   *
   * @param size to chop the file at.
   */
  FileWriter.prototype.truncate = function(size) {
      // Throw an exception if we are already writing a file
      if (this.readyState === FileWriter.WRITING) {
          throw FileError.INVALID_STATE_ERR;
      }

      // WRITING state
      this.readyState = FileWriter.WRITING;

      var me = this;

      // If onwritestart callback
      if (typeof me.onwritestart === "function") {
          me.onwritestart({"type":"writestart", "target":this});
      }

      // Write file
      PhoneGap.exec(
          // Success callback
          function(r) {
              var evt;
              // If DONE (cancelled), then don't do anything
              if (me.readyState === FileWriter.DONE) {
                  return;
              }

              // Update the length of the file
              me.length = r;
              me.position = Math.min(me.position, r);

              // If onwrite callback
              if (typeof me.onwrite === "function") {
                  me.onwrite({"type":"write", "target":me});
              }

              // DONE state
              me.readyState = FileWriter.DONE;

              // If onwriteend callback
              if (typeof me.onwriteend === "function") {
                  me.onwriteend({"type":"writeend", "target":me});
              }
          },
          // Error callback
          function(e) {
              var evt;
              // If DONE (cancelled), then don't do anything
              if (me.readyState === FileWriter.DONE) {
                  return;
              }

              // Save error
              me.error = e;

              // If onerror callback
              if (typeof me.onerror === "function") {
                  me.onerror({"type":"error", "target":me});
              }

              // DONE state
              me.readyState = FileWriter.DONE;

              // If onwriteend callback
              if (typeof me.onwriteend === "function") {
                  me.onwriteend({"type":"writeend", "target":me});
              }
          }, "File", "truncate", [this.fileName, size]);
  };

  /**
   * Information about the state of the file or directory
   *
   * @constructor
   * {Date} modificationTime (readonly)
   */
  var Metadata = function() {
      this.modificationTime=null;
  };

  /**
   * Supplies arguments to methods that lookup or create files and directories
   *
   * @constructor
   * @param {boolean} create file or directory if it doesn't exist
   * @param {boolean} exclusive if true the command will fail if the file or directory exists
   */
  var Flags = function(create, exclusive) {
      this.create = create || false;
      this.exclusive = exclusive || false;
  };

  /**
   * An interface representing a file system
   *
   * @constructor
   * {DOMString} name the unique name of the file system (readonly)
   * {DirectoryEntry} root directory of the file system (readonly)
   */
  var FileSystem = function() {
      this.name = null;
      this.root = null;
  };

  /**
   * An interface that lists the files and directories in a directory.
   * @constructor
   */
  var DirectoryReader = function(fullPath){
      this.fullPath = fullPath || null;
  };

  /**
   * Returns a list of entries from a directory.
   *
   * @param {Function} successCallback is called with a list of entries
   * @param {Function} errorCallback is called with a FileError
   */
  DirectoryReader.prototype.readEntries = function(successCallback, errorCallback) {
      PhoneGap.exec(successCallback, errorCallback, "File", "readEntries", [this.fullPath]);
  };

  /**
   * An interface representing a directory on the file system.
   *
   * @constructor
   * {boolean} isFile always false (readonly)
   * {boolean} isDirectory always true (readonly)
   * {DOMString} name of the directory, excluding the path leading to it (readonly)
   * {DOMString} fullPath the absolute full path to the directory (readonly)
   * {FileSystem} filesystem on which the directory resides (readonly)
   */
  var DirectoryEntry = function() {
      this.isFile = false;
      this.isDirectory = true;
      this.name = null;
      this.fullPath = null;
      this.filesystem = null;
  };

  /**
   * Copies a directory to a new location
   *
   * @param {DirectoryEntry} parent the directory to which to copy the entry
   * @param {DOMString} newName the new name of the entry, defaults to the current name
   * @param {Function} successCallback is called with the new entry
   * @param {Function} errorCallback is called with a FileError
   */
  DirectoryEntry.prototype.copyTo = function(parent, newName, successCallback, errorCallback) {
      PhoneGap.exec(successCallback, errorCallback, "File", "copyTo", [this.fullPath, parent, newName]);
  };

  /**
   * Looks up the metadata of the entry
   *
   * @param {Function} successCallback is called with a Metadata object
   * @param {Function} errorCallback is called with a FileError
   */
  DirectoryEntry.prototype.getMetadata = function(successCallback, errorCallback) {
      PhoneGap.exec(successCallback, errorCallback, "File", "getMetadata", [this.fullPath]);
  };

  /**
   * Gets the parent of the entry
   *
   * @param {Function} successCallback is called with a parent entry
   * @param {Function} errorCallback is called with a FileError
   */
  DirectoryEntry.prototype.getParent = function(successCallback, errorCallback) {
      PhoneGap.exec(successCallback, errorCallback, "File", "getParent", [this.fullPath]);
  };

  /**
   * Moves a directory to a new location
   *
   * @param {DirectoryEntry} parent the directory to which to move the entry
   * @param {DOMString} newName the new name of the entry, defaults to the current name
   * @param {Function} successCallback is called with the new entry
   * @param {Function} errorCallback is called with a FileError
   */
  DirectoryEntry.prototype.moveTo = function(parent, newName, successCallback, errorCallback) {
      PhoneGap.exec(successCallback, errorCallback, "File", "moveTo", [this.fullPath, parent, newName]);
  };

  /**
   * Removes the entry
   *
   * @param {Function} successCallback is called with no parameters
   * @param {Function} errorCallback is called with a FileError
   */
  DirectoryEntry.prototype.remove = function(successCallback, errorCallback) {
      PhoneGap.exec(successCallback, errorCallback, "File", "remove", [this.fullPath]);
  };

  /**
   * Returns a URI that can be used to identify this entry.
   *
   * @param {DOMString} mimeType for a FileEntry, the mime type to be used to interpret the file, when loaded through this URI.
   * @return uri
   */
  DirectoryEntry.prototype.toURI = function(mimeType) {
      return "file://" + this.fullPath;
  };

  /**
   * Creates a new DirectoryReader to read entries from this directory
   */
  DirectoryEntry.prototype.createReader = function(successCallback, errorCallback) {
      return new DirectoryReader(this.fullPath);
  };

  /**
   * Creates or looks up a directory
   *
   * @param {DOMString} path either a relative or absolute path from this directory in which to look up or create a directory
   * @param {Flags} options to create or excluively create the directory
   * @param {Function} successCallback is called with the new entry
   * @param {Function} errorCallback is called with a FileError
   */
  DirectoryEntry.prototype.getDirectory = function(path, options, successCallback, errorCallback) {
      PhoneGap.exec(successCallback, errorCallback, "File", "getDirectory", [this.fullPath, path, options]);
  };

  /**
   * Creates or looks up a file
   *
   * @param {DOMString} path either a relative or absolute path from this directory in which to look up or create a file
   * @param {Flags} options to create or excluively create the file
   * @param {Function} successCallback is called with the new entry
   * @param {Function} errorCallback is called with a FileError
   */
  DirectoryEntry.prototype.getFile = function(path, options, successCallback, errorCallback) {
      PhoneGap.exec(successCallback, errorCallback, "File", "getFile", [this.fullPath, path, options]);
  };

  /**
   * Deletes a directory and all of it's contents
   *
   * @param {Function} successCallback is called with no parameters
   * @param {Function} errorCallback is called with a FileError
   */
  DirectoryEntry.prototype.removeRecursively = function(successCallback, errorCallback) {
      PhoneGap.exec(successCallback, errorCallback, "File", "removeRecursively", [this.fullPath]);
  };

  /**
   * An interface representing a directory on the file system.
   *
   * @constructor
   * {boolean} isFile always true (readonly)
   * {boolean} isDirectory always false (readonly)
   * {DOMString} name of the file, excluding the path leading to it (readonly)
   * {DOMString} fullPath the absolute full path to the file (readonly)
   * {FileSystem} filesystem on which the directory resides (readonly)
   */
  var FileEntry = function() {
      this.isFile = true;
      this.isDirectory = false;
      this.name = null;
      this.fullPath = null;
      this.filesystem = null;
  };

  /**
   * Copies a file to a new location
   *
   * @param {DirectoryEntry} parent the directory to which to copy the entry
   * @param {DOMString} newName the new name of the entry, defaults to the current name
   * @param {Function} successCallback is called with the new entry
   * @param {Function} errorCallback is called with a FileError
   */
  FileEntry.prototype.copyTo = function(parent, newName, successCallback, errorCallback) {
      PhoneGap.exec(successCallback, errorCallback, "File", "copyTo", [this.fullPath, parent, newName]);
  };

  /**
   * Looks up the metadata of the entry
   *
   * @param {Function} successCallback is called with a Metadata object
   * @param {Function} errorCallback is called with a FileError
   */
  FileEntry.prototype.getMetadata = function(successCallback, errorCallback) {
      PhoneGap.exec(successCallback, errorCallback, "File", "getMetadata", [this.fullPath]);
  };

  /**
   * Gets the parent of the entry
   *
   * @param {Function} successCallback is called with a parent entry
   * @param {Function} errorCallback is called with a FileError
   */
  FileEntry.prototype.getParent = function(successCallback, errorCallback) {
      PhoneGap.exec(successCallback, errorCallback, "File", "getParent", [this.fullPath]);
  };

  /**
   * Moves a directory to a new location
   *
   * @param {DirectoryEntry} parent the directory to which to move the entry
   * @param {DOMString} newName the new name of the entry, defaults to the current name
   * @param {Function} successCallback is called with the new entry
   * @param {Function} errorCallback is called with a FileError
   */
  FileEntry.prototype.moveTo = function(parent, newName, successCallback, errorCallback) {
      PhoneGap.exec(successCallback, errorCallback, "File", "moveTo", [this.fullPath, parent, newName]);
  };

  /**
   * Removes the entry
   *
   * @param {Function} successCallback is called with no parameters
   * @param {Function} errorCallback is called with a FileError
   */
  FileEntry.prototype.remove = function(successCallback, errorCallback) {
      PhoneGap.exec(successCallback, errorCallback, "File", "remove", [this.fullPath]);
  };

  /**
   * Returns a URI that can be used to identify this entry.
   *
   * @param {DOMString} mimeType for a FileEntry, the mime type to be used to interpret the file, when loaded through this URI.
   * @return uri
   */
  FileEntry.prototype.toURI = function(mimeType) {
      return "file://" + this.fullPath;
  };

  /**
   * Creates a new FileWriter associated with the file that this FileEntry represents.
   *
   * @param {Function} successCallback is called with the new FileWriter
   * @param {Function} errorCallback is called with a FileError
   */
  FileEntry.prototype.createWriter = function(successCallback, errorCallback) {
      this.file(function(filePointer) {
          var writer = new FileWriter(filePointer);

          if (writer.fileName === null || writer.fileName === "") {
              if (typeof errorCallback == "function") {
                  errorCallback({
                      "code": FileError.INVALID_STATE_ERR
                  });
              }
          }

          if (typeof successCallback == "function") {
              successCallback(writer);
          }       
      }, errorCallback);
  };

  /**
   * Returns a File that represents the current state of the file that this FileEntry represents.
   *
   * @param {Function} successCallback is called with the new File object
   * @param {Function} errorCallback is called with a FileError
   */
  FileEntry.prototype.file = function(successCallback, errorCallback) {
      PhoneGap.exec(successCallback, errorCallback, "File", "getFileMetadata", [this.fullPath]);
  };

  /** @constructor */
  var LocalFileSystem = function() {
  };

  // File error codes
  LocalFileSystem.TEMPORARY = 0;
  LocalFileSystem.PERSISTENT = 1;
  LocalFileSystem.RESOURCE = 2;
  LocalFileSystem.APPLICATION = 3;

  /**
   * Requests a filesystem in which to store application data.
   *
   * @param {int} type of file system being requested
   * @param {Function} successCallback is called with the new FileSystem
   * @param {Function} errorCallback is called with a FileError
   */
  LocalFileSystem.prototype.requestFileSystem = function(type, size, successCallback, errorCallback) {
      if (type < 0 || type > 3) {
          if (typeof errorCallback == "function") {
              errorCallback({
                  "code": FileError.SYNTAX_ERR
              });
          }
      }
      else {
          PhoneGap.exec(successCallback, errorCallback, "File", "requestFileSystem", [type, size]);
      }
  };

  /**
   *
   * @param {DOMString} uri referring to a local file in a filesystem
   * @param {Function} successCallback is called with the new entry
   * @param {Function} errorCallback is called with a FileError
   */
  LocalFileSystem.prototype.resolveLocalFileSystemURI = function(uri, successCallback, errorCallback) {
      PhoneGap.exec(successCallback, errorCallback, "File", "resolveLocalFileSystemURI", [uri]);
  };

  /**
  * This function returns and array of contacts.  It is required as we need to convert raw
  * JSON objects into concrete Contact objects.  Currently this method is called after
  * navigator.service.contacts.find but before the find methods success call back.
  *
  * @param a JSON Objects that need to be converted to DirectoryEntry or FileEntry objects.
  * @returns an entry
  */
  LocalFileSystem.prototype._castFS = function(pluginResult) {
      var entry = null;
      entry = new DirectoryEntry();
      entry.isDirectory = pluginResult.message.root.isDirectory;
      entry.isFile = pluginResult.message.root.isFile;
      entry.name = pluginResult.message.root.name;
      entry.fullPath = pluginResult.message.root.fullPath;
      pluginResult.message.root = entry;
      return pluginResult;
  };

  LocalFileSystem.prototype._castEntry = function(pluginResult) {
      var entry = null;
      if (pluginResult.message.isDirectory) {
          console.log("This is a dir");
          entry = new DirectoryEntry();
      }
      else if (pluginResult.message.isFile) {
          console.log("This is a file");
          entry = new FileEntry();
      }
      entry.isDirectory = pluginResult.message.isDirectory;
      entry.isFile = pluginResult.message.isFile;
      entry.name = pluginResult.message.name;
      entry.fullPath = pluginResult.message.fullPath;
      pluginResult.message = entry;
      return pluginResult;
  };

  LocalFileSystem.prototype._castEntries = function(pluginResult) {
      var entries = pluginResult.message;
      var retVal = [];
      for (var i=0; i<entries.length; i++) {
          retVal.push(window.localFileSystem._createEntry(entries[i]));
      }
      pluginResult.message = retVal;
      return pluginResult;
  };

  LocalFileSystem.prototype._createEntry = function(castMe) {
      var entry = null;
      if (castMe.isDirectory) {
          console.log("This is a dir");
          entry = new DirectoryEntry();
      }
      else if (castMe.isFile) {
          console.log("This is a file");
          entry = new FileEntry();
      }
      entry.isDirectory = castMe.isDirectory;
      entry.isFile = castMe.isFile;
      entry.name = castMe.name;
      entry.fullPath = castMe.fullPath;
      return entry;
  };

  LocalFileSystem.prototype._castDate = function(pluginResult) {
      if (pluginResult.message.modificationTime) {
          var modTime = new Date(pluginResult.message.modificationTime);
          pluginResult.message.modificationTime = modTime;
      }
      else if (pluginResult.message.lastModifiedDate) {
          var file = new File();
          file.size = pluginResult.message.size;
          file.type = pluginResult.message.type;
          file.name = pluginResult.message.name;
          file.fullPath = pluginResult.message.fullPath;
          file.lastModifiedDate = new Date(pluginResult.message.lastModifiedDate);
          pluginResult.message = file;
      }
      return pluginResult;
  };

  /**
   * Add the FileSystem interface into the browser.
   */
  PhoneGap.addConstructor(function() {
      var pgLocalFileSystem = new LocalFileSystem();
      // Needed for cast methods
      if(typeof window.localFileSystem == "undefined") window.localFileSystem  = pgLocalFileSystem;
      if(typeof window.requestFileSystem == "undefined") window.requestFileSystem  = pgLocalFileSystem.requestFileSystem;
      if(typeof window.resolveLocalFileSystemURI == "undefined") window.resolveLocalFileSystemURI = pgLocalFileSystem.resolveLocalFileSystemURI;
  });
  }/*
   * PhoneGap is available under *either* the terms of the modified BSD license *or* the
   * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
   *
   * Copyright (c) 2005-2010, Nitobi Software Inc.
   * Copyright (c) 2010-2011, IBM Corporation
   */

  if (!PhoneGap.hasResource("filetransfer")) {
  PhoneGap.addResource("filetransfer");

  /**
   * FileTransfer uploads a file to a remote server.
   * @constructor
   */
  var FileTransfer = function() {};

  /**
   * FileUploadResult
   * @constructor
   */
  var FileUploadResult = function() {
      this.bytesSent = 0;
      this.responseCode = null;
      this.response = null;
  };

  /**
   * FileTransferError
   * @constructor
   */
  var FileTransferError = function() {
      this.code = null;
  };

  FileTransferError.FILE_NOT_FOUND_ERR = 1;
  FileTransferError.INVALID_URL_ERR = 2;
  FileTransferError.CONNECTION_ERR = 3;

  /**
  * Given an absolute file path, uploads a file on the device to a remote server
  * using a multipart HTTP request.
  * @param filePath {String}           Full path of the file on the device
  * @param server {String}             URL of the server to receive the file
  * @param successCallback (Function}  Callback to be invoked when upload has completed
  * @param errorCallback {Function}    Callback to be invoked upon error
  * @param options {FileUploadOptions} Optional parameters such as file name and mimetype
  */
  FileTransfer.prototype.upload = function(filePath, server, successCallback, errorCallback, options, debug) {

      // check for options
      var fileKey = null;
      var fileName = null;
      var mimeType = null;
      var params = null;
      var chunkedMode = true;
      if (options) {
          fileKey = options.fileKey;
          fileName = options.fileName;
          mimeType = options.mimeType;
          if (options.chunkedMode != null || typeof options.chunkedMode != "undefined") {
              chunkedMode = options.chunkedMode;
          }
          if (options.params) {
              params = options.params;
          }
          else {
              params = {};
          }
      }

      PhoneGap.exec(successCallback, errorCallback, 'FileTransfer', 'upload', [filePath, server, fileKey, fileName, mimeType, params, debug, chunkedMode]);
  };

  /**
   * Options to customize the HTTP request used to upload files.
   * @constructor
   * @param fileKey {String}   Name of file request parameter.
   * @param fileName {String}  Filename to be used by the server. Defaults to image.jpg.
   * @param mimeType {String}  Mimetype of the uploaded file. Defaults to image/jpeg.
   * @param params {Object}    Object with key: value params to send to the server.
   */
  var FileUploadOptions = function(fileKey, fileName, mimeType, params) {
      this.fileKey = fileKey || null;
      this.fileName = fileName || null;
      this.mimeType = mimeType || null;
      this.params = params || null;
  };
  }
  /*
   * PhoneGap is available under *either* the terms of the modified BSD license *or* the
   * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
   *
   * Copyright (c) 2005-2010, Nitobi Software Inc.
   * Copyright (c) 2010-2011, IBM Corporation
   */

  if (!PhoneGap.hasResource("geolocation")) {
  PhoneGap.addResource("geolocation");

  /**
   * This class provides access to device GPS data.
   * @constructor
   */
  var Geolocation = function() {

      // The last known GPS position.
      this.lastPosition = null;

      // Geolocation listeners
      this.listeners = {};
  };

  /**
   * Position error object
   *
   * @constructor
   * @param code
   * @param message
   */
  var PositionError = function(code, message) {
      this.code = code;
      this.message = message;
  };

  PositionError.PERMISSION_DENIED = 1;
  PositionError.POSITION_UNAVAILABLE = 2;
  PositionError.TIMEOUT = 3;

  /**
   * Asynchronously aquires the current position.
   *
   * @param {Function} successCallback    The function to call when the position data is available
   * @param {Function} errorCallback      The function to call when there is an error getting the heading position. (OPTIONAL)
   * @param {PositionOptions} options     The options for getting the position data. (OPTIONAL)
   */
  Geolocation.prototype.getCurrentPosition = function(successCallback, errorCallback, options) {
      if (navigator._geo.listeners.global) {
          console.log("Geolocation Error: Still waiting for previous getCurrentPosition() request.");
          try {
              errorCallback(new PositionError(PositionError.TIMEOUT, "Geolocation Error: Still waiting for previous getCurrentPosition() request."));
          } catch (e) {
          }
          return;
      }
      var maximumAge = 10000;
      var enableHighAccuracy = false;
      var timeout = 10000;
      if (typeof options !== "undefined") {
          if (typeof options.maximumAge !== "undefined") {
              maximumAge = options.maximumAge;
          }
          if (typeof options.enableHighAccuracy !== "undefined") {
              enableHighAccuracy = options.enableHighAccuracy;
          }
          if (typeof options.timeout !== "undefined") {
              timeout = options.timeout;
          }
      }
      navigator._geo.listeners.global = {"success" : successCallback, "fail" : errorCallback };
      PhoneGap.exec(null, null, "Geolocation", "getCurrentLocation", [enableHighAccuracy, timeout, maximumAge]);
  };

  /**
   * Asynchronously watches the geolocation for changes to geolocation.  When a change occurs,
   * the successCallback is called with the new location.
   *
   * @param {Function} successCallback    The function to call each time the location data is available
   * @param {Function} errorCallback      The function to call when there is an error getting the location data. (OPTIONAL)
   * @param {PositionOptions} options     The options for getting the location data such as frequency. (OPTIONAL)
   * @return String                       The watch id that must be passed to #clearWatch to stop watching.
   */
  Geolocation.prototype.watchPosition = function(successCallback, errorCallback, options) {
      var maximumAge = 10000;
      var enableHighAccuracy = false;
      var timeout = 10000;
      if (typeof options !== "undefined") {
          if (typeof options.frequency  !== "undefined") {
              maximumAge = options.frequency;
          }
          if (typeof options.maximumAge !== "undefined") {
              maximumAge = options.maximumAge;
          }
          if (typeof options.enableHighAccuracy !== "undefined") {
              enableHighAccuracy = options.enableHighAccuracy;
          }
          if (typeof options.timeout !== "undefined") {
              timeout = options.timeout;
          }
      }
      var id = PhoneGap.createUUID();
      navigator._geo.listeners[id] = {"success" : successCallback, "fail" : errorCallback };
      PhoneGap.exec(null, null, "Geolocation", "start", [id, enableHighAccuracy, timeout, maximumAge]);
      return id;
  };

  /*
   * Native callback when watch position has a new position.
   * PRIVATE METHOD
   *
   * @param {String} id
   * @param {Number} lat
   * @param {Number} lng
   * @param {Number} alt
   * @param {Number} altacc
   * @param {Number} head
   * @param {Number} vel
   * @param {Number} stamp
   */
  Geolocation.prototype.success = function(id, lat, lng, alt, altacc, head, vel, stamp) {
      var coords = new Coordinates(lat, lng, alt, altacc, head, vel);
      var loc = new Position(coords, stamp);
      try {
          if (lat === "undefined" || lng === "undefined") {
              navigator._geo.listeners[id].fail(new PositionError(PositionError.POSITION_UNAVAILABLE, "Lat/Lng are undefined."));
          }
          else {
              navigator._geo.lastPosition = loc;
              navigator._geo.listeners[id].success(loc);
          }
      }
      catch (e) {
          console.log("Geolocation Error: Error calling success callback function.");
      }

      if (id === "global") {
          delete navigator._geo.listeners.global;
      }
  };

  /**
   * Native callback when watch position has an error.
   * PRIVATE METHOD
   *
   * @param {String} id       The ID of the watch
   * @param {Number} code     The error code
   * @param {String} msg      The error message
   */
  Geolocation.prototype.fail = function(id, code, msg) {
      try {
          navigator._geo.listeners[id].fail(new PositionError(code, msg));
      }
      catch (e) {
          console.log("Geolocation Error: Error calling error callback function.");
      }
  };

  /**
   * Clears the specified heading watch.
   *
   * @param {String} id       The ID of the watch returned from #watchPosition
   */
  Geolocation.prototype.clearWatch = function(id) {
      PhoneGap.exec(null, null, "Geolocation", "stop", [id]);
      delete navigator._geo.listeners[id];
  };

  /**
   * Force the PhoneGap geolocation to be used instead of built-in.
   */
  Geolocation.usingPhoneGap = false;
  Geolocation.usePhoneGap = function() {
      if (Geolocation.usingPhoneGap) {
          return;
      }
      Geolocation.usingPhoneGap = true;

      // Set built-in geolocation methods to our own implementations
      // (Cannot replace entire geolocation, but can replace individual methods)
      navigator.geolocation.setLocation = navigator._geo.setLocation;
      navigator.geolocation.getCurrentPosition = navigator._geo.getCurrentPosition;
      navigator.geolocation.watchPosition = navigator._geo.watchPosition;
      navigator.geolocation.clearWatch = navigator._geo.clearWatch;
      navigator.geolocation.start = navigator._geo.start;
      navigator.geolocation.stop = navigator._geo.stop;
  };

  PhoneGap.addConstructor(function() {
      navigator._geo = new Geolocation();

      // No native geolocation object for Android 1.x, so use PhoneGap geolocation
      if (typeof navigator.geolocation === 'undefined') {
          navigator.geolocation = navigator._geo;
          Geolocation.usingPhoneGap = true;
      }
  });
  }
  /*
   * PhoneGap is available under *either* the terms of the modified BSD license *or* the
   * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
   *
   * Copyright (c) 2005-2010, Nitobi Software Inc.
   * Copyright (c) 2010-2011, IBM Corporation
   */

  if (!PhoneGap.hasResource("media")) {
  PhoneGap.addResource("media");

  /**
   * This class provides access to the device media, interfaces to both sound and video
   *
   * @constructor
   * @param src                   The file name or url to play
   * @param successCallback       The callback to be called when the file is done playing or recording.
   *                                  successCallback() - OPTIONAL
   * @param errorCallback         The callback to be called if there is an error.
   *                                  errorCallback(int errorCode) - OPTIONAL
   * @param statusCallback        The callback to be called when media status has changed.
   *                                  statusCallback(int statusCode) - OPTIONAL
   * @param positionCallback      The callback to be called when media position has changed.
   *                                  positionCallback(long position) - OPTIONAL
   */
  var Media = function(src, successCallback, errorCallback, statusCallback, positionCallback) {

      // successCallback optional
      if (successCallback && (typeof successCallback !== "function")) {
          console.log("Media Error: successCallback is not a function");
          return;
      }

      // errorCallback optional
      if (errorCallback && (typeof errorCallback !== "function")) {
          console.log("Media Error: errorCallback is not a function");
          return;
      }

      // statusCallback optional
      if (statusCallback && (typeof statusCallback !== "function")) {
          console.log("Media Error: statusCallback is not a function");
          return;
      }

      // statusCallback optional
      if (positionCallback && (typeof positionCallback !== "function")) {
          console.log("Media Error: positionCallback is not a function");
          return;
      }

      this.id = PhoneGap.createUUID();
      PhoneGap.mediaObjects[this.id] = this;
      this.src = src;
      this.successCallback = successCallback;
      this.errorCallback = errorCallback;
      this.statusCallback = statusCallback;
      this.positionCallback = positionCallback;
      this._duration = -1;
      this._position = -1;
  };

  // Media messages
  Media.MEDIA_STATE = 1;
  Media.MEDIA_DURATION = 2;
  Media.MEDIA_POSITION = 3;
  Media.MEDIA_ERROR = 9;

  // Media states
  Media.MEDIA_NONE = 0;
  Media.MEDIA_STARTING = 1;
  Media.MEDIA_RUNNING = 2;
  Media.MEDIA_PAUSED = 3;
  Media.MEDIA_STOPPED = 4;
  Media.MEDIA_MSG = ["None", "Starting", "Running", "Paused", "Stopped"];

  // TODO: Will MediaError be used?
  /**
   * This class contains information about any Media errors.
   * @constructor
   */
  var MediaError = function() {
      this.code = null;
      this.message = "";
  };

  MediaError.MEDIA_ERR_ABORTED        = 1;
  MediaError.MEDIA_ERR_NETWORK        = 2;
  MediaError.MEDIA_ERR_DECODE         = 3;
  MediaError.MEDIA_ERR_NONE_SUPPORTED = 4;

  /**
   * Start or resume playing audio file.
   */
  Media.prototype.play = function() {
      PhoneGap.exec(null, null, "Media", "startPlayingAudio", [this.id, this.src]);
  };

  /**
   * Stop playing audio file.
   */
  Media.prototype.stop = function() {
      return PhoneGap.exec(null, null, "Media", "stopPlayingAudio", [this.id]);
  };

  /**
   * Seek or jump to a new time in the track..
   */
  Media.prototype.seekTo = function(milliseconds) {
      PhoneGap.exec(null, null, "Media", "seekToAudio", [this.id, milliseconds]);
  };

  /**
   * Pause playing audio file.
   */
  Media.prototype.pause = function() {
      PhoneGap.exec(null, null, "Media", "pausePlayingAudio", [this.id]);
  };

  /**
   * Get duration of an audio file.
   * The duration is only set for audio that is playing, paused or stopped.
   *
   * @return      duration or -1 if not known.
   */
  Media.prototype.getDuration = function() {
      return this._duration;
  };

  /**
   * Get position of audio.
   */
  Media.prototype.getCurrentPosition = function(success, fail) {
      PhoneGap.exec(success, fail, "Media", "getCurrentPositionAudio", [this.id]);
  };

  /**
   * Start recording audio file.
   */
  Media.prototype.startRecord = function() {
      PhoneGap.exec(null, null, "Media", "startRecordingAudio", [this.id, this.src]);
  };

  /**
   * Stop recording audio file.
   */
  Media.prototype.stopRecord = function() {
      PhoneGap.exec(null, null, "Media", "stopRecordingAudio", [this.id]);
  };

  /**
   * Release the resources.
   */
  Media.prototype.release = function() {
      PhoneGap.exec(null, null, "Media", "release", [this.id]);
  };

  /**
   * Adjust the volume.
   */
  Media.prototype.setVolume = function(volume) {
      PhoneGap.exec(null, null, "Media", "setVolume", [this.id, volume]);
  };

  /**
   * List of media objects.
   * PRIVATE
   */
  PhoneGap.mediaObjects = {};

  /**
   * Object that receives native callbacks.
   * PRIVATE
   * @constructor
   */
  PhoneGap.Media = function() {};

  /**
   * Get the media object.
   * PRIVATE
   *
   * @param id            The media object id (string)
   */
  PhoneGap.Media.getMediaObject = function(id) {
      return PhoneGap.mediaObjects[id];
  };

  /**
   * Audio has status update.
   * PRIVATE
   *
   * @param id            The media object id (string)
   * @param status        The status code (int)
   * @param msg           The status message (string)
   */
  PhoneGap.Media.onStatus = function(id, msg, value) {
      var media = PhoneGap.mediaObjects[id];
      // If state update
      if (msg === Media.MEDIA_STATE) {
          if (value === Media.MEDIA_STOPPED) {
              if (media.successCallback) {
                  media.successCallback();
              }
          }
          if (media.statusCallback) {
              media.statusCallback(value);
          }
      }
      else if (msg === Media.MEDIA_DURATION) {
          media._duration = value;
      }
      else if (msg === Media.MEDIA_ERROR) {
          if (media.errorCallback) {
              media.errorCallback(value);
          }
      }
      else if (msg == Media.MEDIA_POSITION) {
          media._position = value;
      }
  };
  }
  /*
   * PhoneGap is available under *either* the terms of the modified BSD license *or* the
   * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
   *
   * Copyright (c) 2005-2010, Nitobi Software Inc.
   * Copyright (c) 2010-2011, IBM Corporation
   */

  if (!PhoneGap.hasResource("network")) {
  PhoneGap.addResource("network");

  /**
   * This class contains information about the current network Connection.
   * @constructor
   */
  var Connection = function() {
      this.type = null;
      this._firstRun = true;
      this._timer = null;
      this.timeout = 500;

      var me = this;
      this.getInfo(
          function(type) {
              // Need to send events if we are on or offline
              if (type == "none") {
                  // set a timer if still offline at the end of timer send the offline event
                  me._timer = setTimeout(function(){
                      me.type = type;
                      PhoneGap.fireDocumentEvent('offline');
                      me._timer = null;
                      }, me.timeout);
              } else {
                  // If there is a current offline event pending clear it
                  if (me._timer != null) {
                      clearTimeout(me._timer);
                      me._timer = null;
                  }
                  me.type = type;
                  PhoneGap.fireDocumentEvent('online');
              }

              // should only fire this once
              if (me._firstRun) {
                  me._firstRun = false;
                  PhoneGap.onPhoneGapConnectionReady.fire();
              }            
          },
          function(e) {
              // If we can't get the network info we should still tell PhoneGap
              // to fire the deviceready event.
              if (me._firstRun) {
                  me._firstRun = false;
                  PhoneGap.onPhoneGapConnectionReady.fire();
              }            
              console.log("Error initializing Network Connection: " + e);
          });
  };

  Connection.UNKNOWN = "unknown";
  Connection.ETHERNET = "ethernet";
  Connection.WIFI = "wifi";
  Connection.CELL_2G = "2g";
  Connection.CELL_3G = "3g";
  Connection.CELL_4G = "4g";
  Connection.NONE = "none";

  /**
   * Get connection info
   *
   * @param {Function} successCallback The function to call when the Connection data is available
   * @param {Function} errorCallback The function to call when there is an error getting the Connection data. (OPTIONAL)
   */
  Connection.prototype.getInfo = function(successCallback, errorCallback) {
      // Get info
      PhoneGap.exec(successCallback, errorCallback, "Network Status", "getConnectionInfo", []);
  };


  PhoneGap.addConstructor(function() {
      if (typeof navigator.network === "undefined") {
          navigator.network = new Object();
      }
      if (typeof navigator.network.connection === "undefined") {
          navigator.network.connection = new Connection();
      }
  });
  }
  /*
   * PhoneGap is available under *either* the terms of the modified BSD license *or* the
   * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
   *
   * Copyright (c) 2005-2010, Nitobi Software Inc.
   * Copyright (c) 2010-2011, IBM Corporation
   */

  if (!PhoneGap.hasResource("notification")) {
  PhoneGap.addResource("notification");

  /**
   * This class provides access to notifications on the device.
   * @constructor
   */
  var Notification = function() {
  };

  /**
   * Open a native alert dialog, with a customizable title and button text.
   *
   * @param {String} message              Message to print in the body of the alert
   * @param {Function} completeCallback   The callback that is called when user clicks on a button.
   * @param {String} title                Title of the alert dialog (default: Alert)
   * @param {String} buttonLabel          Label of the close button (default: OK)
   */
  Notification.prototype.alert = function(message, completeCallback, title, buttonLabel) {
      var _title = (title || "Alert");
      var _buttonLabel = (buttonLabel || "OK");
      PhoneGap.exec(completeCallback, null, "Notification", "alert", [message,_title,_buttonLabel]);
  };

  /**
   * Open a native confirm dialog, with a customizable title and button text.
   * The result that the user selects is returned to the result callback.
   *
   * @param {String} message              Message to print in the body of the alert
   * @param {Function} resultCallback     The callback that is called when user clicks on a button.
   * @param {String} title                Title of the alert dialog (default: Confirm)
   * @param {String} buttonLabels         Comma separated list of the labels of the buttons (default: 'OK,Cancel')
   */
  Notification.prototype.confirm = function(message, resultCallback, title, buttonLabels) {
      var _title = (title || "Confirm");
      var _buttonLabels = (buttonLabels || "OK,Cancel");
      PhoneGap.exec(resultCallback, null, "Notification", "confirm", [message,_title,_buttonLabels]);
  };

  /**
   * Start spinning the activity indicator on the statusbar
   */
  Notification.prototype.activityStart = function() {
      PhoneGap.exec(null, null, "Notification", "activityStart", ["Busy","Please wait..."]);
  };

  /**
   * Stop spinning the activity indicator on the statusbar, if it's currently spinning
   */
  Notification.prototype.activityStop = function() {
      PhoneGap.exec(null, null, "Notification", "activityStop", []);
  };

  /**
   * Display a progress dialog with progress bar that goes from 0 to 100.
   *
   * @param {String} title        Title of the progress dialog.
   * @param {String} message      Message to display in the dialog.
   */
  Notification.prototype.progressStart = function(title, message) {
      PhoneGap.exec(null, null, "Notification", "progressStart", [title, message]);
  };

  /**
   * Set the progress dialog value.
   *
   * @param {Number} value         0-100
   */
  Notification.prototype.progressValue = function(value) {
      PhoneGap.exec(null, null, "Notification", "progressValue", [value]);
  };

  /**
   * Close the progress dialog.
   */
  Notification.prototype.progressStop = function() {
      PhoneGap.exec(null, null, "Notification", "progressStop", []);
  };

  /**
   * Causes the device to blink a status LED.
   *
   * @param {Integer} count       The number of blinks.
   * @param {String} colour       The colour of the light.
   */
  Notification.prototype.blink = function(count, colour) {
      // NOT IMPLEMENTED
  };

  /**
   * Causes the device to vibrate.
   *
   * @param {Integer} mills       The number of milliseconds to vibrate for.
   */
  Notification.prototype.vibrate = function(mills) {
      PhoneGap.exec(null, null, "Notification", "vibrate", [mills]);
  };

  /**
   * Causes the device to beep.
   * On Android, the default notification ringtone is played "count" times.
   *
   * @param {Integer} count       The number of beeps.
   */
  Notification.prototype.beep = function(count) {
      PhoneGap.exec(null, null, "Notification", "beep", [count]);
  };

  PhoneGap.addConstructor(function() {
      if (typeof navigator.notification === "undefined") {
          navigator.notification = new Notification();
      }
  });
  }
  /*
   * PhoneGap is available under *either* the terms of the modified BSD license *or* the
   * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
   *
   * Copyright (c) 2005-2010, Nitobi Software Inc.
   * Copyright (c) 2010-2011, IBM Corporation
   */

  if (!PhoneGap.hasResource("position")) {
  PhoneGap.addResource("position");

  /**
   * This class contains position information.
   * @param {Object} lat
   * @param {Object} lng
   * @param {Object} acc
   * @param {Object} alt
   * @param {Object} altacc
   * @param {Object} head
   * @param {Object} vel
   * @constructor
   */
  var Position = function(coords, timestamp) {
  	this.coords = coords;
  	this.timestamp = (timestamp !== 'undefined') ? timestamp : new Date().getTime();
  };

  /** @constructor */
  var Coordinates = function(lat, lng, alt, acc, head, vel, altacc) {
  	/**
  	 * The latitude of the position.
  	 */
  	this.latitude = lat;
  	/**
  	 * The longitude of the position,
  	 */
  	this.longitude = lng;
  	/**
  	 * The accuracy of the position.
  	 */
  	this.accuracy = acc;
  	/**
  	 * The altitude of the position.
  	 */
  	this.altitude = alt;
  	/**
  	 * The direction the device is moving at the position.
  	 */
  	this.heading = head;
  	/**
  	 * The velocity with which the device is moving at the position.
  	 */
  	this.speed = vel;
  	/**
  	 * The altitude accuracy of the position.
  	 */
  	this.altitudeAccuracy = (altacc !== 'undefined') ? altacc : null;
  };

  /**
   * This class specifies the options for requesting position data.
   * @constructor
   */
  var PositionOptions = function() {
  	/**
  	 * Specifies the desired position accuracy.
  	 */
  	this.enableHighAccuracy = true;
  	/**
  	 * The timeout after which if position data cannot be obtained the errorCallback
  	 * is called.
  	 */
  	this.timeout = 10000;
  };

  /**
   * This class contains information about any GSP errors.
   * @constructor
   */
  var PositionError = function() {
  	this.code = null;
  	this.message = "";
  };

  PositionError.UNKNOWN_ERROR = 0;
  PositionError.PERMISSION_DENIED = 1;
  PositionError.POSITION_UNAVAILABLE = 2;
  PositionError.TIMEOUT = 3;
  }
  /*
   * PhoneGap is available under *either* the terms of the modified BSD license *or* the
   * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
   *
   * Copyright (c) 2005-2010, Nitobi Software Inc.
   * Copyright (c) 2010-2011, IBM Corporation
   */

  /*
   * This is purely for the Android 1.5/1.6 HTML 5 Storage
   * I was hoping that Android 2.0 would deprecate this, but given the fact that
   * most manufacturers ship with Android 1.5 and do not do OTA Updates, this is required
   */

  if (!PhoneGap.hasResource("storage")) {
  PhoneGap.addResource("storage");

  /**
   * SQL result set object
   * PRIVATE METHOD
   * @constructor
   */
  var DroidDB_Rows = function() {
      this.resultSet = [];    // results array
      this.length = 0;        // number of rows
  };

  /**
   * Get item from SQL result set
   *
   * @param row           The row number to return
   * @return              The row object
   */
  DroidDB_Rows.prototype.item = function(row) {
      return this.resultSet[row];
  };

  /**
   * SQL result set that is returned to user.
   * PRIVATE METHOD
   * @constructor
   */
  var DroidDB_Result = function() {
      this.rows = new DroidDB_Rows();
  };

  /**
   * Storage object that is called by native code when performing queries.
   * PRIVATE METHOD
   * @constructor
   */
  var DroidDB = function() {
      this.queryQueue = {};
  };

  /**
   * Callback from native code when query is complete.
   * PRIVATE METHOD
   *
   * @param id                Query id
   */
  DroidDB.prototype.completeQuery = function(id, data) {
      var query = this.queryQueue[id];
      if (query) {
          try {
              delete this.queryQueue[id];

              // Get transaction
              var tx = query.tx;

              // If transaction hasn't failed
              // Note: We ignore all query results if previous query
              //       in the same transaction failed.
              if (tx && tx.queryList[id]) {

                  // Save query results
                  var r = new DroidDB_Result();
                  r.rows.resultSet = data;
                  r.rows.length = data.length;
                  try {
                      if (typeof query.successCallback === 'function') {
                          query.successCallback(query.tx, r);
                      }
                  } catch (ex) {
                      console.log("executeSql error calling user success callback: "+ex);
                  }

                  tx.queryComplete(id);
              }
          } catch (e) {
              console.log("executeSql error: "+e);
          }
      }
  };

  /**
   * Callback from native code when query fails
   * PRIVATE METHOD
   *
   * @param reason            Error message
   * @param id                Query id
   */
  DroidDB.prototype.fail = function(reason, id) {
      var query = this.queryQueue[id];
      if (query) {
          try {
              delete this.queryQueue[id];

              // Get transaction
              var tx = query.tx;

              // If transaction hasn't failed
              // Note: We ignore all query results if previous query
              //       in the same transaction failed.
              if (tx && tx.queryList[id]) {
                  tx.queryList = {};

                  try {
                      if (typeof query.errorCallback === 'function') {
                          query.errorCallback(query.tx, reason);
                      }
                  } catch (ex) {
                      console.log("executeSql error calling user error callback: "+ex);
                  }

                  tx.queryFailed(id, reason);
              }

          } catch (e) {
              console.log("executeSql error: "+e);
          }
      }
  };

  /**
   * SQL query object
   * PRIVATE METHOD
   *
   * @constructor
   * @param tx                The transaction object that this query belongs to
   */
  var DroidDB_Query = function(tx) {

      // Set the id of the query
      this.id = PhoneGap.createUUID();

      // Add this query to the queue
      droiddb.queryQueue[this.id] = this;

      // Init result
      this.resultSet = [];

      // Set transaction that this query belongs to
      this.tx = tx;

      // Add this query to transaction list
      this.tx.queryList[this.id] = this;

      // Callbacks
      this.successCallback = null;
      this.errorCallback = null;

  };

  /**
   * Transaction object
   * PRIVATE METHOD
   * @constructor
   */
  var DroidDB_Tx = function() {

      // Set the id of the transaction
      this.id = PhoneGap.createUUID();

      // Callbacks
      this.successCallback = null;
      this.errorCallback = null;

      // Query list
      this.queryList = {};
  };

  /**
   * Mark query in transaction as complete.
   * If all queries are complete, call the user's transaction success callback.
   *
   * @param id                Query id
   */
  DroidDB_Tx.prototype.queryComplete = function(id) {
      delete this.queryList[id];

      // If no more outstanding queries, then fire transaction success
      if (this.successCallback) {
          var count = 0;
          var i;
          for (i in this.queryList) {
              if (this.queryList.hasOwnProperty(i)) {
                  count++;
              }
          }
          if (count === 0) {
              try {
                  this.successCallback();
              } catch(e) {
                  console.log("Transaction error calling user success callback: " + e);
              }
          }
      }
  };

  /**
   * Mark query in transaction as failed.
   *
   * @param id                Query id
   * @param reason            Error message
   */
  DroidDB_Tx.prototype.queryFailed = function(id, reason) {

      // The sql queries in this transaction have already been run, since
      // we really don't have a real transaction implemented in native code.
      // However, the user callbacks for the remaining sql queries in transaction
      // will not be called.
      this.queryList = {};

      if (this.errorCallback) {
          try {
              this.errorCallback(reason);
          } catch(e) {
              console.log("Transaction error calling user error callback: " + e);
          }
      }
  };

  /**
   * Execute SQL statement
   *
   * @param sql                   SQL statement to execute
   * @param params                Statement parameters
   * @param successCallback       Success callback
   * @param errorCallback         Error callback
   */
  DroidDB_Tx.prototype.executeSql = function(sql, params, successCallback, errorCallback) {

      // Init params array
      if (typeof params === 'undefined') {
          params = [];
      }

      // Create query and add to queue
      var query = new DroidDB_Query(this);
      droiddb.queryQueue[query.id] = query;

      // Save callbacks
      query.successCallback = successCallback;
      query.errorCallback = errorCallback;

      // Call native code
      PhoneGap.exec(null, null, "Storage", "executeSql", [sql, params, query.id]);
  };

  var DatabaseShell = function() {
  };

  /**
   * Start a transaction.
   * Does not support rollback in event of failure.
   *
   * @param process {Function}            The transaction function
   * @param successCallback {Function}
   * @param errorCallback {Function}
   */
  DatabaseShell.prototype.transaction = function(process, errorCallback, successCallback) {
      var tx = new DroidDB_Tx();
      tx.successCallback = successCallback;
      tx.errorCallback = errorCallback;
      try {
          process(tx);
      } catch (e) {
          console.log("Transaction error: "+e);
          if (tx.errorCallback) {
              try {
                  tx.errorCallback(e);
              } catch (ex) {
                  console.log("Transaction error calling user error callback: "+e);
              }
          }
      }
  };

  /**
   * Open database
   *
   * @param name              Database name
   * @param version           Database version
   * @param display_name      Database display name
   * @param size              Database size in bytes
   * @return                  Database object
   */
  var DroidDB_openDatabase = function(name, version, display_name, size) {
      PhoneGap.exec(null, null, "Storage", "openDatabase", [name, version, display_name, size]);
      var db = new DatabaseShell();
      return db;
  };

  /**
   * For browsers with no localStorage we emulate it with SQLite. Follows the w3c api.
   * TODO: Do similar for sessionStorage.
   */

  /**
   * @constructor
   */
  var CupcakeLocalStorage = function() {
  		try {

  			this.db = openDatabase('localStorage', '1.0', 'localStorage', 2621440);
  			var storage = {};
  			this.length = 0;
  			function setLength (length) {
  				this.length = length;
  				localStorage.length = length;
  			}
  			this.db.transaction(
  				function (transaction) {
  				    var i;
  					transaction.executeSql('CREATE TABLE IF NOT EXISTS storage (id NVARCHAR(40) PRIMARY KEY, body NVARCHAR(255))');
  					transaction.executeSql('SELECT * FROM storage', [], function(tx, result) {
  						for(var i = 0; i < result.rows.length; i++) {
  							storage[result.rows.item(i)['id']] =  result.rows.item(i)['body'];
  						}
  						setLength(result.rows.length);
  						PhoneGap.initializationComplete("cupcakeStorage");
  					});

  				},
  				function (err) {
  					alert(err.message);
  				}
  			);
  			this.setItem = function(key, val) {
  				if (typeof(storage[key])=='undefined') {
  					this.length++;
  				}
  				storage[key] = val;
  				this.db.transaction(
  					function (transaction) {
  						transaction.executeSql('CREATE TABLE IF NOT EXISTS storage (id NVARCHAR(40) PRIMARY KEY, body NVARCHAR(255))');
  						transaction.executeSql('REPLACE INTO storage (id, body) values(?,?)', [key,val]);
  					}
  				);
  			};
  			this.getItem = function(key) {
  				return storage[key];
  			};
  			this.removeItem = function(key) {
  				delete storage[key];
  				this.length--;
  				this.db.transaction(
  					function (transaction) {
  						transaction.executeSql('CREATE TABLE IF NOT EXISTS storage (id NVARCHAR(40) PRIMARY KEY, body NVARCHAR(255))');
  						transaction.executeSql('DELETE FROM storage where id=?', [key]);
  					}
  				);
  			};
  			this.clear = function() {
  				storage = {};
  				this.length = 0;
  				this.db.transaction(
  					function (transaction) {
  						transaction.executeSql('CREATE TABLE IF NOT EXISTS storage (id NVARCHAR(40) PRIMARY KEY, body NVARCHAR(255))');
  						transaction.executeSql('DELETE FROM storage', []);
  					}
  				);
  			};
  			this.key = function(index) {
  				var i = 0;
  				for (var j in storage) {
  					if (i==index) {
  						return j;
  					} else {
  						i++;
  					}
  				}
  				return null;
  			};

  		} catch(e) {
  			alert("Database error "+e+".");
  		    return;
  		}
  };

  PhoneGap.addConstructor(function() {
      var setupDroidDB = function() {
          navigator.openDatabase = window.openDatabase = DroidDB_openDatabase;
          window.droiddb = new DroidDB();
      }
      if (typeof window.openDatabase === "undefined") {
          setupDroidDB();
      } else {
          window.openDatabase_orig = window.openDatabase;
          window.openDatabase = function(name, version, desc, size){
              // Some versions of Android will throw a SECURITY_ERR so we need 
              // to catch the exception and seutp our own DB handling.
              var db = null;
              try {
                  db = window.openDatabase_orig(name, version, desc, size);
              } 
              catch (ex) {
                  db = null;
              }

              if (db == null) {
                  setupDroidDB();
                  return DroidDB_openDatabase(name, version, desc, size);
              }
              else {
                  return db;
              }
          }
      }

      if (typeof window.localStorage === "undefined") {
          navigator.localStorage = window.localStorage = new CupcakeLocalStorage();
          PhoneGap.waitForInitialization("cupcakeStorage");
      }
  });
  }
  
} else {
  // contents of phonegap-1.1.0-ios.js
  /*
   * PhoneGap v1.1.0 is available under *either* the terms of the modified BSD license *or* the
   * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
   * 
   * Copyright (c) 2005-2010, Nitobi Software Inc.
   * Copyright (c) 2010-2011, IBM Corporation
   * Copyright (c) 2011, Codevise Solutions Ltd.
   * Copyright (c) 2011, Proyectos Equis Ka, S.L.
   * 
   */

  if (typeof PhoneGap === "undefined") {

  if (typeof(DeviceInfo) !== 'object'){
      DeviceInfo = {};
  }
  /**
   * This represents the PhoneGap API itself, and provides a global namespace for accessing
   * information about the state of PhoneGap.
   * @class
   */
  PhoneGap = {
      // This queue holds the currently executing command and all pending
      // commands executed with PhoneGap.exec().
      commandQueue: [],
      // Indicates if we're currently in the middle of flushing the command
      // queue on the native side.
      commandQueueFlushing: false,
      _constructors: [],
      documentEventHandler: {},   // Collection of custom document event handlers
      windowEventHandler: {} 
  };

  /**
   * List of resource files loaded by PhoneGap.
   * This is used to ensure JS and other files are loaded only once.
   */
  PhoneGap.resources = {base: true};

  /**
   * Determine if resource has been loaded by PhoneGap
   *
   * @param name
   * @return
   */
  PhoneGap.hasResource = function(name) {
      return PhoneGap.resources[name];
  };

  /**
   * Add a resource to list of loaded resources by PhoneGap
   *
   * @param name
   */
  PhoneGap.addResource = function(name) {
      PhoneGap.resources[name] = true;
  };

  /**
   * Boolean flag indicating if the PhoneGap API is available and initialized.
   */ // TODO: Remove this, it is unused here ... -jm
  PhoneGap.available = DeviceInfo.uuid != undefined;

  /**
   * Add an initialization function to a queue that ensures it will run and initialize
   * application constructors only once PhoneGap has been initialized.
   * @param {Function} func The function callback you want run once PhoneGap is initialized
   */
  PhoneGap.addConstructor = function(func) {
      var state = document.readyState;
      if ( ( state == 'loaded' || state == 'complete' ) && DeviceInfo.uuid != null )
      {
          func();
      }
      else
      {
          PhoneGap._constructors.push(func);
      }
  };

  (function() 
   {
      var timer = setInterval(function()
      {

          var state = document.readyState;

          if ( ( state == 'loaded' || state == 'complete' ) && DeviceInfo.uuid != null )
          {
              clearInterval(timer); // stop looking
              // run our constructors list
              while (PhoneGap._constructors.length > 0) 
              {
                  var constructor = PhoneGap._constructors.shift();
                  try 
                  {
                      constructor();
                  } 
                  catch(e) 
                  {
                      if (typeof(console['log']) == 'function')
                      {
                          console.log("Failed to run constructor: " + console.processMessage(e));
                      }
                      else
                      {
                          alert("Failed to run constructor: " + e.message);
                      }
                  }
              }
              // all constructors run, now fire the deviceready event
              var e = document.createEvent('Events'); 
              e.initEvent('deviceready');
              document.dispatchEvent(e);
          }
      }, 1);
  })();

  // session id for calls
  PhoneGap.sessionKey = 0;

  // centralized callbacks
  PhoneGap.callbackId = 0;
  PhoneGap.callbacks = {};
  PhoneGap.callbackStatus = {
      NO_RESULT: 0,
      OK: 1,
      CLASS_NOT_FOUND_EXCEPTION: 2,
      ILLEGAL_ACCESS_EXCEPTION: 3,
      INSTANTIATION_EXCEPTION: 4,
      MALFORMED_URL_EXCEPTION: 5,
      IO_EXCEPTION: 6,
      INVALID_ACTION: 7,
      JSON_EXCEPTION: 8,
      ERROR: 9
      };

  /**
   * Creates a gap bridge iframe used to notify the native code about queued
   * commands.
   *
   * @private
   */
  PhoneGap.createGapBridge = function() {
      gapBridge = document.createElement("iframe");
      gapBridge.setAttribute("style", "display:none;");
      gapBridge.setAttribute("height","0px");
      gapBridge.setAttribute("width","0px");
      gapBridge.setAttribute("frameborder","0");
      document.documentElement.appendChild(gapBridge);
      return gapBridge;
  }

  /** 
   * Execute a PhoneGap command by queuing it and letting the native side know
   * there are queued commands. The native side will then request all of the
   * queued commands and execute them.
   *
   * Arguments may be in one of two formats:
   *
   * FORMAT ONE (preferable)
   * The native side will call PhoneGap.callbackSuccess or
   * PhoneGap.callbackError, depending upon the result of the action.
   *
   * @param {Function} success    The success callback
   * @param {Function} fail       The fail callback
   * @param {String} service      The name of the service to use
   * @param {String} action       The name of the action to use
   * @param {String[]} [args]     Zero or more arguments to pass to the method
   *      
   * FORMAT TWO
   * @param {String} command    Command to be run in PhoneGap, e.g.
   *                            "ClassName.method"
   * @param {String[]} [args]   Zero or more arguments to pass to the method
   *                            object parameters are passed as an array object
   *                            [object1, object2] each object will be passed as
   *                            JSON strings 
   */
  PhoneGap.exec = function() { 
      if (!PhoneGap.available) {
          alert("ERROR: Attempting to call PhoneGap.exec()"
                +" before 'deviceready'. Ignoring.");
          return;
      }

      var successCallback, failCallback, service, action, actionArgs;
      var callbackId = null;
      if (typeof arguments[0] !== "string") {
          // FORMAT ONE
          successCallback = arguments[0];
          failCallback = arguments[1];
          service = arguments[2];
          action = arguments[3];
          actionArgs = arguments[4];

          // Since we need to maintain backwards compatibility, we have to pass
          // an invalid callbackId even if no callback was provided since plugins
          // will be expecting it. The PhoneGap.exec() implementation allocates
          // an invalid callbackId and passes it even if no callbacks were given.
          callbackId = 'INVALID';
      } else {
          // FORMAT TWO
          splitCommand = arguments[0].split(".");
          action = splitCommand.pop();
          service = splitCommand.join(".");
          actionArgs = Array.prototype.splice.call(arguments, 1);
      }

      // Start building the command object.
      var command = {
          className: service,
          methodName: action,
          arguments: []
      };

      // Register the callbacks and add the callbackId to the positional
      // arguments if given.
      if (successCallback || failCallback) {
          callbackId = service + PhoneGap.callbackId++;
          PhoneGap.callbacks[callbackId] = 
              {success:successCallback, fail:failCallback};
      }
      if (callbackId != null) {
          command.arguments.push(callbackId);
      }

      for (var i = 0; i < actionArgs.length; ++i) {
          var arg = actionArgs[i];
          if (arg == undefined || arg == null) {
              continue;
          } else if (typeof(arg) == 'object') {
              command.options = arg;
          } else {
              command.arguments.push(arg);
          }
      }

      // Stringify and queue the command. We stringify to command now to
      // effectively clone the command arguments in case they are mutated before
      // the command is executed.
      PhoneGap.commandQueue.push(JSON.stringify(command));

      // If the queue length is 1, then that means it was empty before we queued
      // the given command, so let the native side know that we have some
      // commands to execute, unless the queue is currently being flushed, in
      // which case the command will be picked up without notification.
      if (PhoneGap.commandQueue.length == 1 && !PhoneGap.commandQueueFlushing) {
          if (!PhoneGap.gapBridge) {
              PhoneGap.gapBridge = PhoneGap.createGapBridge();
          }

          PhoneGap.gapBridge.src = "gap://ready";
      }
  }

  /**
   * Called by native code to retrieve all queued commands and clear the queue.
   */
  PhoneGap.getAndClearQueuedCommands = function() {
    json = JSON.stringify(PhoneGap.commandQueue);
    PhoneGap.commandQueue = [];
    return json;
  }

  /**
   * Called by native code when returning successful result from an action.
   *
   * @param callbackId
   * @param args
   *        args.status - PhoneGap.callbackStatus
   *        args.message - return value
   *        args.keepCallback - 0 to remove callback, 1 to keep callback in PhoneGap.callbacks[]
   */
  PhoneGap.callbackSuccess = function(callbackId, args) {
      if (PhoneGap.callbacks[callbackId]) {

          // If result is to be sent to callback
          if (args.status == PhoneGap.callbackStatus.OK) {
              try {
                  if (PhoneGap.callbacks[callbackId].success) {
                         PhoneGap.callbacks[callbackId].success(args.message);
                  }
              }
              catch (e) {
                  console.log("Error in success callback: "+callbackId+" = "+e);
              }
          }

          // Clear callback if not expecting any more results
          if (!args.keepCallback) {
              delete PhoneGap.callbacks[callbackId];
          }
      }
  };

  /**
   * Called by native code when returning error result from an action.
   *
   * @param callbackId
   * @param args
   */
  PhoneGap.callbackError = function(callbackId, args) {
      if (PhoneGap.callbacks[callbackId]) {
          try {
              if (PhoneGap.callbacks[callbackId].fail) {
                  PhoneGap.callbacks[callbackId].fail(args.message);
              }
          }
          catch (e) {
              console.log("Error in error callback: "+callbackId+" = "+e);
          }

          // Clear callback if not expecting any more results
          if (!args.keepCallback) {
              delete PhoneGap.callbacks[callbackId];
          }
      }
  };


  /**
   * Does a deep clone of the object.
   *
   * @param obj
   * @return
   */
  PhoneGap.clone = function(obj) {
      if(!obj) { 
          return obj;
      }

      if(obj instanceof Array){
          var retVal = new Array();
          for(var i = 0; i < obj.length; ++i){
              retVal.push(PhoneGap.clone(obj[i]));
          }
          return retVal;
      }

      if (obj instanceof Function) {
          return obj;
      }

      if(!(obj instanceof Object)){
          return obj;
      }

      if (obj instanceof Date) {
          return obj;
      }

      retVal = new Object();
      for(i in obj){
          if(!(i in retVal) || retVal[i] != obj[i]) {
              retVal[i] = PhoneGap.clone(obj[i]);
          }
      }
      return retVal;
  };

  // Intercept calls to document.addEventListener 
  PhoneGap.m_document_addEventListener = document.addEventListener;

  // Intercept calls to window.addEventListener
  PhoneGap.m_window_addEventListener = window.addEventListener;

  /**
   * Add a custom window event handler.
   *
   * @param {String} event            The event name that callback handles
   * @param {Function} callback       The event handler
   */
  PhoneGap.addWindowEventHandler = function(event, callback) {
      PhoneGap.windowEventHandler[event] = callback;
  }

  /**
   * Add a custom document event handler.
   *
   * @param {String} event            The event name that callback handles
   * @param {Function} callback       The event handler
   */
  PhoneGap.addDocumentEventHandler = function(event, callback) {
      PhoneGap.documentEventHandler[event] = callback;
  }

  /**
   * Intercept adding document event listeners and handle our own
   *
   * @param {Object} evt
   * @param {Function} handler
   * @param capture
   */
  document.addEventListener = function(evt, handler, capture) {
      var e = evt.toLowerCase();

      // If subscribing to an event that is handled by a plugin
      if (typeof PhoneGap.documentEventHandler[e] !== "undefined") {
          if (PhoneGap.documentEventHandler[e](e, handler, true)) {
              return; // Stop default behavior
          }
      }

      PhoneGap.m_document_addEventListener.call(document, evt, handler, capture); 
  };

  /**
   * Intercept adding window event listeners and handle our own
   *
   * @param {Object} evt
   * @param {Function} handler
   * @param capture
   */
  window.addEventListener = function(evt, handler, capture) {
      var e = evt.toLowerCase();

      // If subscribing to an event that is handled by a plugin
      if (typeof PhoneGap.windowEventHandler[e] !== "undefined") {
          if (PhoneGap.windowEventHandler[e](e, handler, true)) {
              return; // Stop default behavior
          }
      }

      PhoneGap.m_window_addEventListener.call(window, evt, handler, capture);
  };

  // Intercept calls to document.removeEventListener and watch for events that
  // are generated by PhoneGap native code
  PhoneGap.m_document_removeEventListener = document.removeEventListener;

  // Intercept calls to window.removeEventListener
  PhoneGap.m_window_removeEventListener = window.removeEventListener;

  /**
   * Intercept removing document event listeners and handle our own
   *
   * @param {Object} evt
   * @param {Function} handler
   * @param capture
   */
  document.removeEventListener = function(evt, handler, capture) {
      var e = evt.toLowerCase();

      // If unsubcribing from an event that is handled by a plugin
      if (typeof PhoneGap.documentEventHandler[e] !== "undefined") {
          if (PhoneGap.documentEventHandler[e](e, handler, false)) {
              return; // Stop default behavior
          }
      }

      PhoneGap.m_document_removeEventListener.call(document, evt, handler, capture);
  };

  /**
   * Intercept removing window event listeners and handle our own
   *
   * @param {Object} evt
   * @param {Function} handler
   * @param capture
   */
  window.removeEventListener = function(evt, handler, capture) {
      var e = evt.toLowerCase();

      // If unsubcribing from an event that is handled by a plugin
      if (typeof PhoneGap.windowEventHandler[e] !== "undefined") {
          if (PhoneGap.windowEventHandler[e](e, handler, false)) {
              return; // Stop default behavior
          }
      }

      PhoneGap.m_window_removeEventListener.call(window, evt, handler, capture);
  };

  /**
   * Method to fire document event
   *
   * @param {String} type             The event type to fire
   * @param {Object} data             Data to send with event
   */
  PhoneGap.fireDocumentEvent = function(type, data) {
      var e = document.createEvent('Events');
      e.initEvent(type);
      if (data) {
          for (var i in data) {
              e[i] = data[i];
          }
      }
      document.dispatchEvent(e);
  };

  /**
   * Method to fire window event
   *
   * @param {String} type             The event type to fire
   * @param {Object} data             Data to send with event
   */
  PhoneGap.fireWindowEvent = function(type, data) {
      var e = document.createEvent('Events');
      e.initEvent(type);
      if (data) {
          for (var i in data) {
              e[i] = data[i];
          }
      }
      window.dispatchEvent(e);
  };

  /**
   * Method to fire event from native code
   * Leaving this generic version to handle problems with iOS 3.x. Is currently used by orientation and battery events
   * Remove when iOS 3.x no longer supported and call fireWindowEvent or fireDocumentEvent directly
   */
  PhoneGap.fireEvent = function(type, target, data) {
      var e = document.createEvent('Events');
      e.initEvent(type);
      if (data) {
          for (var i in data) {
              e[i] = data[i];
          }
      }
      target = target || document;
      if (target.dispatchEvent === undefined) { // ie window.dispatchEvent is undefined in iOS 3.x
          target = document;
      } 

      target.dispatchEvent(e);
  };
  /**
   * Create a UUID
   *
   * @return
   */
  PhoneGap.createUUID = function() {
      return PhoneGap.UUIDcreatePart(4) + '-' +
          PhoneGap.UUIDcreatePart(2) + '-' +
          PhoneGap.UUIDcreatePart(2) + '-' +
          PhoneGap.UUIDcreatePart(2) + '-' +
          PhoneGap.UUIDcreatePart(6);
  };

  PhoneGap.UUIDcreatePart = function(length) {
      var uuidpart = "";
      for (var i=0; i<length; i++) {
          var uuidchar = parseInt((Math.random() * 256)).toString(16);
          if (uuidchar.length == 1) {
              uuidchar = "0" + uuidchar;
          }
          uuidpart += uuidchar;
      }
      return uuidpart;
  };
  };


  if (!PhoneGap.hasResource("debugconsole")) {
  	PhoneGap.addResource("debugconsole");

  /**
   * This class provides access to the debugging console.
   * @constructor
   */
  var DebugConsole = function() {
      this.winConsole = window.console;
      this.logLevel = DebugConsole.INFO_LEVEL;
  }

  // from most verbose, to least verbose
  DebugConsole.ALL_LEVEL    = 1; // same as first level
  DebugConsole.INFO_LEVEL   = 1;
  DebugConsole.WARN_LEVEL   = 2;
  DebugConsole.ERROR_LEVEL  = 4;
  DebugConsole.NONE_LEVEL   = 8;

  DebugConsole.prototype.setLevel = function(level) {
      this.logLevel = level;
  };

  /**
   * Utility function for rendering and indenting strings, or serializing
   * objects to a string capable of being printed to the console.
   * @param {Object|String} message The string or object to convert to an indented string
   * @private
   */
  DebugConsole.prototype.processMessage = function(message, maxDepth) {
  	if (maxDepth === undefined) maxDepth = 0;
      if (typeof(message) != 'object') {
          return (this.isDeprecated ? "WARNING: debug object is deprecated, please use console object \n" + message : message);
      } else {
          /**
           * @function
           * @ignore
           */
          function indent(str) {
              return str.replace(/^/mg, "    ");
          }
          /**
           * @function
           * @ignore
           */
          function makeStructured(obj, depth) {
              var str = "";
              for (var i in obj) {
                  try {
                      if (typeof(obj[i]) == 'object' && depth < maxDepth) {
                          str += i + ":\n" + indent(makeStructured(obj[i])) + "\n";
                      } else {
                          str += i + " = " + indent(String(obj[i])).replace(/^    /, "") + "\n";
                      }
                  } catch(e) {
                      str += i + " = EXCEPTION: " + e.message + "\n";
                  }
              }
              return str;
          }

          return ("Object:\n" + makeStructured(message, maxDepth));
      }
  };

  /**
   * Print a normal log message to the console
   * @param {Object|String} message Message or object to print to the console
   */
  DebugConsole.prototype.log = function(message, maxDepth) {
      if (PhoneGap.available && this.logLevel <= DebugConsole.INFO_LEVEL)
          PhoneGap.exec(null, null, 'com.phonegap.debugconsole', 'log',
              [ this.processMessage(message, maxDepth), { logLevel: 'INFO' } ]
          );
      else
          this.winConsole.log(message);
  };

  /**
   * Print a warning message to the console
   * @param {Object|String} message Message or object to print to the console
   */
  DebugConsole.prototype.warn = function(message, maxDepth) {
      if (PhoneGap.available && this.logLevel <= DebugConsole.WARN_LEVEL)
      	PhoneGap.exec(null, null, 'com.phonegap.debugconsole', 'log',
              [ this.processMessage(message, maxDepth), { logLevel: 'WARN' } ]
          );
      else
          this.winConsole.error(message);
  };

  /**
   * Print an error message to the console
   * @param {Object|String} message Message or object to print to the console
   */
  DebugConsole.prototype.error = function(message, maxDepth) {
      if (PhoneGap.available && this.logLevel <= DebugConsole.ERROR_LEVEL)
  		PhoneGap.exec(null, null, 'com.phonegap.debugconsole', 'log',
              [ this.processMessage(message, maxDepth), { logLevel: 'ERROR' } ]
          );
      else
          this.winConsole.error(message);
  };

  PhoneGap.addConstructor(function() {
      window.console = new DebugConsole();
  });
  };
  if (!PhoneGap.hasResource("position")) {
  	PhoneGap.addResource("position");

  /**
   * This class contains position information.
   * @param {Object} lat
   * @param {Object} lng
   * @param {Object} acc
   * @param {Object} alt
   * @param {Object} altAcc
   * @param {Object} head
   * @param {Object} vel
   * @constructor
   */
  Position = function(coords, timestamp) {
  	this.coords = Coordinates.cloneFrom(coords);
      this.timestamp = timestamp || new Date().getTime();
  };

  Position.prototype.equals = function(other) {
      return (this.coords && other && other.coords &&
              this.coords.latitude == other.coords.latitude &&
              this.coords.longitude == other.coords.longitude);
  };

  Position.prototype.clone = function()
  {
      return new Position(
          this.coords? this.coords.clone() : null,
          this.timestamp? this.timestamp : new Date().getTime()
      );
  }

  Coordinates = function(lat, lng, alt, acc, head, vel, altAcc) {
  	/**
  	 * The latitude of the position.
  	 */
  	this.latitude = lat;
  	/**
  	 * The longitude of the position,
  	 */
  	this.longitude = lng;
  	/**
  	 * The altitude of the position.
  	 */
  	this.altitude = alt;
  	/**
  	 * The accuracy of the position.
  	 */
  	this.accuracy = acc;
  	/**
  	 * The direction the device is moving at the position.
  	 */
  	this.heading = head;
  	/**
  	 * The velocity with which the device is moving at the position.
  	 */
  	this.speed = vel;
  	/**
  	 * The altitude accuracy of the position.
  	 */
  	this.altitudeAccuracy = (altAcc != 'undefined') ? altAcc : null; 
  };

  Coordinates.prototype.clone = function()
  {
      return new Coordinates(
          this.latitude,
          this.longitude,
          this.altitude,
          this.accuracy,
          this.heading,
          this.speed,
          this.altitudeAccuracy
      );
  };

  Coordinates.cloneFrom = function(obj)
  {
      return new Coordinates(
          obj.latitude,
          obj.longitude,
          obj.altitude,
          obj.accuracy,
          obj.heading,
          obj.speed,
          obj.altitudeAccuracy
      );
  };

  /**
   * This class specifies the options for requesting position data.
   * @constructor
   */
  PositionOptions = function(enableHighAccuracy, timeout, maximumAge) {
  	/**
  	 * Specifies the desired position accuracy.
  	 */
  	this.enableHighAccuracy = enableHighAccuracy || false;
  	/**
  	 * The timeout after which if position data cannot be obtained the errorCallback
  	 * is called.
  	 */
  	this.timeout = timeout || 10000;
  	/**
       * The age of a cached position whose age is no greater than the specified time 
       * in milliseconds. 
       */
  	this.maximumAge = maximumAge || 0;

  	if (this.maximumAge < 0) {
  		this.maximumAge = 0;
  	}
  };

  /**
   * This class contains information about any GPS errors.
   * @constructor
   */
  PositionError = function(code, message) {
  	this.code = code || 0;
  	this.message = message || "";
  };

  PositionError.UNKNOWN_ERROR = 0;
  PositionError.PERMISSION_DENIED = 1;
  PositionError.POSITION_UNAVAILABLE = 2;
  PositionError.TIMEOUT = 3;

  };if (!PhoneGap.hasResource("acceleration")) {
  	PhoneGap.addResource("acceleration");


  /**
   * This class contains acceleration information
   * @constructor
   * @param {Number} x The force applied by the device in the x-axis.
   * @param {Number} y The force applied by the device in the y-axis.
   * @param {Number} z The force applied by the device in the z-axis.
   */
  Acceleration = function(x, y, z) {
  	/**
  	 * The force applied by the device in the x-axis.
  	 */
  	this.x = x;
  	/**
  	 * The force applied by the device in the y-axis.
  	 */
  	this.y = y;
  	/**
  	 * The force applied by the device in the z-axis.
  	 */
  	this.z = z;
  	/**
  	 * The time that the acceleration was obtained.
  	 */
  	this.timestamp = new Date().getTime();
  }

  /**
   * This class specifies the options for requesting acceleration data.
   * @constructor
   */
  AccelerationOptions = function() {
  	/**
  	 * The timeout after which if acceleration data cannot be obtained the errorCallback
  	 * is called.
  	 */
  	this.timeout = 10000;
  }
  };if (!PhoneGap.hasResource("accelerometer")) {
  	PhoneGap.addResource("accelerometer");

  /**
   * This class provides access to device accelerometer data.
   * @constructor
   */
  Accelerometer = function() 
  {
  	/**
  	 * The last known acceleration.
  	 */
  	this.lastAcceleration = new Acceleration(0,0,0);
  }

  /**
   * Asynchronously aquires the current acceleration.
   * @param {Function} successCallback The function to call when the acceleration
   * data is available
   * @param {Function} errorCallback The function to call when there is an error 
   * getting the acceleration data.
   * @param {AccelerationOptions} options The options for getting the accelerometer data
   * such as timeout.
   */
  Accelerometer.prototype.getCurrentAcceleration = function(successCallback, errorCallback, options) {
  	// If the acceleration is available then call success
  	// If the acceleration is not available then call error

  	// Created for iPhone, Iphone passes back _accel obj litteral
  	if (typeof successCallback == "function") {
  		successCallback(this.lastAcceleration);
  	}
  };

  // private callback called from Obj-C by name
  Accelerometer.prototype._onAccelUpdate = function(x,y,z)
  {
     this.lastAcceleration = new Acceleration(x,y,z);
  };

  /**
   * Asynchronously aquires the acceleration repeatedly at a given interval.
   * @param {Function} successCallback The function to call each time the acceleration
   * data is available
   * @param {Function} errorCallback The function to call when there is an error 
   * getting the acceleration data.
   * @param {AccelerationOptions} options The options for getting the accelerometer data
   * such as timeout.
   */

  Accelerometer.prototype.watchAcceleration = function(successCallback, errorCallback, options) {
  	//this.getCurrentAcceleration(successCallback, errorCallback, options);
  	// TODO: add the interval id to a list so we can clear all watches
   	var frequency = (options != undefined && options.frequency != undefined) ? options.frequency : 10000;
  	var updatedOptions = {
  		desiredFrequency:frequency 
  	}
  	PhoneGap.exec(null, null, "com.phonegap.accelerometer", "start", [options]);

  	return setInterval(function() {
  		navigator.accelerometer.getCurrentAcceleration(successCallback, errorCallback, options);
  	}, frequency);
  };

  /**
   * Clears the specified accelerometer watch.
   * @param {String} watchId The ID of the watch returned from #watchAcceleration.
   */
  Accelerometer.prototype.clearWatch = function(watchId) {
  	PhoneGap.exec(null, null, "com.phonegap.accelerometer", "stop", []);
  	clearInterval(watchId);
  };

  Accelerometer.install = function()
  {
      if (typeof navigator.accelerometer == "undefined") {
  		navigator.accelerometer = new Accelerometer();
  	}
  };

  Accelerometer.installDeviceMotionHandler = function()
  {
  	if (!(window.DeviceMotionEvent == undefined)) {
  		// supported natively, so we don't have to add support
  		return;
  	}	

  	var self = this;
  	var devicemotionEvent = 'devicemotion';
  	self.deviceMotionWatchId = null;
  	self.deviceMotionListenerCount = 0;
  	self.deviceMotionLastEventTimestamp = 0;

  	// backup original `window.addEventListener`, `window.removeEventListener`
      var _addEventListener = window.addEventListener;
      var _removeEventListener = window.removeEventListener;

  	var windowDispatchAvailable = !(window.dispatchEvent === undefined); // undefined in iOS 3.x

  	var accelWin = function(acceleration) {
  		var evt = document.createEvent('Events');
  	    evt.initEvent(devicemotionEvent);

  		evt.acceleration = null; // not all devices have gyroscope, don't care for now if we actually have it.
  		evt.rotationRate = null; // not all devices have gyroscope, don't care for now if we actually have it:
  		evt.accelerationIncludingGravity = acceleration; // accelerometer, all iOS devices have it

  		var currentTime = new Date().getTime();
  		evt.interval =  (self.deviceMotionLastEventTimestamp == 0) ? 0 : (currentTime - self.deviceMotionLastEventTimestamp);
  		self.deviceMotionLastEventTimestamp = currentTime;

  		if (windowDispatchAvailable) {
  			window.dispatchEvent(evt);
  		} else {
  			document.dispatchEvent(evt);
  		}
  	};

  	var accelFail = function() {

  	};

      // override `window.addEventListener`
      window.addEventListener = function() {
          if (arguments[0] === devicemotionEvent) {
              ++(self.deviceMotionListenerCount);
  			if (self.deviceMotionListenerCount == 1) { // start
  				self.deviceMotionWatchId = navigator.accelerometer.watchAcceleration(accelWin, accelFail, { frequency:500});
  			}
  		} 

  		if (!windowDispatchAvailable) {
  			return document.addEventListener.apply(this, arguments);
  		} else {
  			return _addEventListener.apply(this, arguments);
  		}
      };	

      // override `window.removeEventListener'
      window.removeEventListener = function() {
          if (arguments[0] === devicemotionEvent) {
              --(self.deviceMotionListenerCount);
  			if (self.deviceMotionListenerCount == 0) { // stop
  				navigator.accelerometer.clearWatch(self.deviceMotionWatchId);
  			}
  		} 

  		if (!windowDispatchAvailable) {
  			return document.removeEventListener.apply(this, arguments);
  		} else {
  			return _removeEventListener.apply(this, arguments);
  		}
      };	
  };


  PhoneGap.addConstructor(Accelerometer.install);
  PhoneGap.addConstructor(Accelerometer.installDeviceMotionHandler);

  };/*
   * PhoneGap is available under *either* the terms of the modified BSD license *or* the
   * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
   *
   * Copyright (c) 2005-2010, Nitobi Software Inc.
   * Copyright (c) 2010-2011, IBM Corporation
   */

  if (!PhoneGap.hasResource("battery")) {
  PhoneGap.addResource("battery");

  /**
   * This class contains information about the current battery status.
   * @constructor
   */
  var Battery = function() {
      this._level = null;
      this._isPlugged = null;
      this._batteryListener = [];
      this._lowListener = [];
      this._criticalListener = [];
  };

  /**
   * Registers as an event producer for battery events.
   * 
   * @param {Object} eventType
   * @param {Object} handler
   * @param {Object} add
   */
  Battery.prototype.eventHandler = function(eventType, handler, add) {
      var me = navigator.battery;
      if (add) {
          // If there are no current registered event listeners start the battery listener on native side.
          if (me._batteryListener.length === 0 && me._lowListener.length === 0 && me._criticalListener.length === 0) {
              PhoneGap.exec(me._status, me._error, "com.phonegap.battery", "start", []);
          }

          // Register the event listener in the proper array
          if (eventType === "batterystatus") {
              var pos = me._batteryListener.indexOf(handler);
              if (pos === -1) {
              	me._batteryListener.push(handler);
              }
          } else if (eventType === "batterylow") {
              var pos = me._lowListener.indexOf(handler);
              if (pos === -1) {
              	me._lowListener.push(handler);
              }
          } else if (eventType === "batterycritical") {
              var pos = me._criticalListener.indexOf(handler);
              if (pos === -1) {
              	me._criticalListener.push(handler);
              }
          }
      } else {
          // Remove the event listener from the proper array
          if (eventType === "batterystatus") {
              var pos = me._batteryListener.indexOf(handler);
              if (pos > -1) {
                  me._batteryListener.splice(pos, 1);        
              }
          } else if (eventType === "batterylow") {
              var pos = me._lowListener.indexOf(handler);
              if (pos > -1) {
                  me._lowListener.splice(pos, 1);        
              }
          } else if (eventType === "batterycritical") {
              var pos = me._criticalListener.indexOf(handler);
              if (pos > -1) {
                  me._criticalListener.splice(pos, 1);        
              }
          }

          // If there are no more registered event listeners stop the battery listener on native side.
          if (me._batteryListener.length === 0 && me._lowListener.length === 0 && me._criticalListener.length === 0) {
              PhoneGap.exec(null, null, "com.phonegap.battery", "stop", []);
          }
      }
  };

  /**
   * Callback for battery status
   * 
   * @param {Object} info			keys: level, isPlugged
   */
  Battery.prototype._status = function(info) {
  	if (info) {
  		var me = this;
  		if (me._level != info.level || me._isPlugged != info.isPlugged) {
  			// Fire batterystatus event
  			//PhoneGap.fireWindowEvent("batterystatus", info);
  			// use this workaround since iOS 3.x does have window.dispatchEvent
  			PhoneGap.fireEvent("batterystatus", window, info);	

  			// Fire low battery event
  			if (info.level == 20 || info.level == 5) {
  				if (info.level == 20) {
  					//PhoneGap.fireWindowEvent("batterylow", info);
  					// use this workaround since iOS 3.x does not have window.dispatchEvent
  					PhoneGap.fireEvent("batterylow", window, info);
  				}
  				else {
  					//PhoneGap.fireWindowEvent("batterycritical", info);
  					// use this workaround since iOS 3.x does not have window.dispatchEvent
  					PhoneGap.fireEvent("batterycritical", window, info);
  				}
  			}
  		}
  		me._level = info.level;
  		me._isPlugged = info.isPlugged;	
  	}
  };

  /**
   * Error callback for battery start
   */
  Battery.prototype._error = function(e) {
      console.log("Error initializing Battery: " + e);
  };

  PhoneGap.addConstructor(function() {
      if (typeof navigator.battery === "undefined") {
          navigator.battery = new Battery();
          PhoneGap.addWindowEventHandler("batterystatus", navigator.battery.eventHandler);
          PhoneGap.addWindowEventHandler("batterylow", navigator.battery.eventHandler);
          PhoneGap.addWindowEventHandler("batterycritical", navigator.battery.eventHandler);
      }
  });
  }if (!PhoneGap.hasResource("camera")) {
  	PhoneGap.addResource("camera");


  /**
   * This class provides access to the device camera.
   * @constructor
   */
  Camera = function() {

  }
  /**
   *  Available Camera Options
   *  {boolean} allowEdit - true to allow editing image, default = false
   *	{number} quality 0-100 (low to high) default =  100
   *  {Camera.DestinationType} destinationType default = DATA_URL
   *	{Camera.PictureSourceType} sourceType default = CAMERA
   *	{number} targetWidth - width in pixels to scale image default = 0 (no scaling)
   *  {number} targetHeight - height in pixels to scale image default = 0 (no scaling)
   *  {Camera.EncodingType} - encodingType default = JPEG
   */
  /**
   * Format of image that is returned from getPicture.
   *
   * Example: navigator.camera.getPicture(success, fail,
   *              { quality: 80,
   *                destinationType: Camera.DestinationType.DATA_URL,
   *                sourceType: Camera.PictureSourceType.PHOTOLIBRARY})
   */
  Camera.DestinationType = {
      DATA_URL: 0,                // Return base64 encoded string
      FILE_URI: 1                 // Return file uri 
  };
  Camera.prototype.DestinationType = Camera.DestinationType;

  /**
   * Source to getPicture from.
   *
   * Example: navigator.camera.getPicture(success, fail,
   *              { quality: 80,
   *                destinationType: Camera.DestinationType.DATA_URL,
   *                sourceType: Camera.PictureSourceType.PHOTOLIBRARY})
   */
  Camera.PictureSourceType = {
      PHOTOLIBRARY : 0,           // Choose image from picture library 
      CAMERA : 1,                 // Take picture from camera
      SAVEDPHOTOALBUM : 2         // Choose image from picture library 
  };
  Camera.prototype.PictureSourceType = Camera.PictureSourceType;

  /** 
   * Encoding of image returned from getPicture. 
   * 
   * Example: navigator.camera.getPicture(success, fail, 
   *              { quality: 80, 
   *                destinationType: Camera.DestinationType.DATA_URL, 
   *                sourceType: Camera.PictureSourceType.CAMERA, 
   *                encodingType: Camera.EncodingType.PNG}) 
   */ 
  Camera.EncodingType = { 
  	JPEG: 0,                    // Return JPEG encoded image 
  	PNG: 1                      // Return PNG encoded image 
  };
  Camera.prototype.EncodingType = Camera.EncodingType;

  /** 
   * Type of pictures to select from.  Only applicable when
   *	PictureSourceType is PHOTOLIBRARY or SAVEDPHOTOALBUM 
   * 
   * Example: navigator.camera.getPicture(success, fail, 
   *              { quality: 80, 
   *                destinationType: Camera.DestinationType.DATA_URL, 
   *                sourceType: Camera.PictureSourceType.PHOTOLIBRARY, 
   *                mediaType: Camera.MediaType.PICTURE}) 
   */ 
  Camera.MediaType = { 
  	PICTURE: 0,             // allow selection of still pictures only. DEFAULT. Will return format specified via DestinationType
  	VIDEO: 1,                // allow selection of video only, ONLY RETURNS URL
  	ALLMEDIA : 2			// allow selection from all media types
  };
  Camera.prototype.MediaType = Camera.MediaType;

  /**
   * Gets a picture from source defined by "options.sourceType", and returns the
   * image as defined by the "options.destinationType" option.

   * The defaults are sourceType=CAMERA and destinationType=DATA_URL.
   *
   * @param {Function} successCallback
   * @param {Function} errorCallback
   * @param {Object} options
   */
  Camera.prototype.getPicture = function(successCallback, errorCallback, options) {
  	// successCallback required
  	if (typeof successCallback != "function") {
          console.log("Camera Error: successCallback is not a function");
          return;
      }

      // errorCallback optional
      if (errorCallback && (typeof errorCallback != "function")) {
          console.log("Camera Error: errorCallback is not a function");
          return;
      }

  	PhoneGap.exec(successCallback, errorCallback, "com.phonegap.camera","getPicture",[options]);
  };



  PhoneGap.addConstructor(function() {
      if (typeof navigator.camera == "undefined") navigator.camera = new Camera();
  });
  };

  if (!PhoneGap.hasResource("device")) {
  	PhoneGap.addResource("device");

  /**
   * this represents the mobile device, and provides properties for inspecting the model, version, UUID of the
   * phone, etc.
   * @constructor
   */
  Device = function() 
  {
      this.platform = null;
      this.version  = null;
      this.name     = null;
      this.phonegap      = null;
      this.uuid     = null;
      try 
  	{      
  		this.platform = DeviceInfo.platform;
  		this.version  = DeviceInfo.version;
  		this.name     = DeviceInfo.name;
  		this.phonegap = DeviceInfo.gap;
  		this.uuid     = DeviceInfo.uuid;

      } 
  	catch(e) 
  	{
          // TODO: 
      }
  	this.available = PhoneGap.available = this.uuid != null;
  }

  PhoneGap.addConstructor(function() {
  	if (typeof navigator.device === "undefined") {
      	navigator.device = window.device = new Device();
  	}
  });
  };

  if (!PhoneGap.hasResource("capture")) {
  	PhoneGap.addResource("capture");
  /**
   * The CaptureError interface encapsulates all errors in the Capture API.
   */
  function CaptureError() {
     this.code = null;
  };

  // Capture error codes
  CaptureError.CAPTURE_INTERNAL_ERR = 0;
  CaptureError.CAPTURE_APPLICATION_BUSY = 1;
  CaptureError.CAPTURE_INVALID_ARGUMENT = 2;
  CaptureError.CAPTURE_NO_MEDIA_FILES = 3;
  CaptureError.CAPTURE_NOT_SUPPORTED = 20;

  /**
   * The Capture interface exposes an interface to the camera and microphone of the hosting device.
   */
  function Capture() {
  	this.supportedAudioModes = [];
  	this.supportedImageModes = [];
  	this.supportedVideoModes = [];
  };

  /**
   * Launch audio recorder application for recording audio clip(s).
   * 
   * @param {Function} successCB
   * @param {Function} errorCB
   * @param {CaptureAudioOptions} options
   *
   * No audio recorder to launch for iOS - return CAPTURE_NOT_SUPPORTED
   */
  Capture.prototype.captureAudio = function(successCallback, errorCallback, options) {
  	/*if (errorCallback && typeof errorCallback === "function") {
  		errorCallback({
  				"code": CaptureError.CAPTURE_NOT_SUPPORTED
  			});
  	}*/
      PhoneGap.exec(successCallback, errorCallback, "com.phonegap.mediacapture", "captureAudio", [options]);
  };

  /**
   * Launch camera application for taking image(s).
   * 
   * @param {Function} successCB
   * @param {Function} errorCB
   * @param {CaptureImageOptions} options
   */
  Capture.prototype.captureImage = function(successCallback, errorCallback, options) {
      PhoneGap.exec(successCallback, errorCallback, "com.phonegap.mediacapture", "captureImage", [options]);
  };

  /**
   * Launch camera application for taking image(s).
   * 
   * @param {Function} successCB
   * @param {Function} errorCB
   * @param {CaptureImageOptions} options
   */
  Capture.prototype._castMediaFile = function(pluginResult) {
      var mediaFiles = [];
      var i;
      for (i=0; i<pluginResult.message.length; i++) {
          var mediaFile = new MediaFile();
  	    mediaFile.name = pluginResult.message[i].name;
  	    mediaFile.fullPath = pluginResult.message[i].fullPath;
  	    mediaFile.type = pluginResult.message[i].type;
  	    mediaFile.lastModifiedDate = pluginResult.message[i].lastModifiedDate;
  	    mediaFile.size = pluginResult.message[i].size;
          mediaFiles.push(mediaFile);
      }
      pluginResult.message = mediaFiles;
      return pluginResult;
  };

  /**
   * Launch device camera application for recording video(s).
   * 
   * @param {Function} successCB
   * @param {Function} errorCB
   * @param {CaptureVideoOptions} options
   */
  Capture.prototype.captureVideo = function(successCallback, errorCallback, options) {
      PhoneGap.exec(successCallback, errorCallback, "com.phonegap.mediacapture", "captureVideo", [options]);
  };

  /**
   * Encapsulates a set of parameters that the capture device supports.
   */
  function ConfigurationData() {
      // The ASCII-encoded string in lower case representing the media type. 
      this.type; 
      // The height attribute represents height of the image or video in pixels. 
      // In the case of a sound clip this attribute has value 0. 
      this.height = 0;
      // The width attribute represents width of the image or video in pixels. 
      // In the case of a sound clip this attribute has value 0
      this.width = 0;
  };

  /**
   * Encapsulates all image capture operation configuration options.
   */
  var CaptureImageOptions = function() {
      // Upper limit of images user can take. Value must be equal or greater than 1.
      this.limit = 1; 
      // The selected image mode. Must match with one of the elements in supportedImageModes array.
      this.mode = null; 
  };

  /**
   * Encapsulates all video capture operation configuration options.
   */
  var CaptureVideoOptions = function() {
      // Upper limit of videos user can record. Value must be equal or greater than 1.
      this.limit = 1;
      // Maximum duration of a single video clip in seconds.
      this.duration = 0;
      // The selected video mode. Must match with one of the elements in supportedVideoModes array.
      this.mode = null;
  };

  /**
   * Encapsulates all audio capture operation configuration options.
   */
  var CaptureAudioOptions = function() {
      // Upper limit of sound clips user can record. Value must be equal or greater than 1.
      this.limit = 1;
      // Maximum duration of a single sound clip in seconds.
      this.duration = 0;
      // The selected audio mode. Must match with one of the elements in supportedAudioModes array.
      this.mode = null;
  };

  /**
   * Represents a single file.
   * 
   * name {DOMString} name of the file, without path information
   * fullPath {DOMString} the full path of the file, including the name
   * type {DOMString} mime type
   * lastModifiedDate {Date} last modified date
   * size {Number} size of the file in bytes
   */
  function MediaFile(name, fullPath, type, lastModifiedDate, size) {
      this.name = name || null;
      this.fullPath = fullPath || null;
      this.type = type || null;
      this.lastModifiedDate = lastModifiedDate || null;
      this.size = size || 0;
  }

  /**
   * Request capture format data for a specific file and type
   * 
   * @param {Function} successCB
   * @param {Function} errorCB
   */
  MediaFile.prototype.getFormatData = function(successCallback, errorCallback) {
  	if (typeof this.fullPath === "undefined" || this.fullPath === null) {
  		errorCallback({
  				"code": CaptureError.CAPTURE_INVALID_ARGUMENT
  			});
  	} else {
      	PhoneGap.exec(successCallback, errorCallback, "com.phonegap.mediacapture", "getFormatData", [this.fullPath, this.type]);
  	}	
  };

  /**
   * MediaFileData encapsulates format information of a media file.
   * 
   * @param {DOMString} codecs
   * @param {long} bitrate
   * @param {long} height
   * @param {long} width
   * @param {float} duration
   */
  function MediaFileData(codecs, bitrate, height, width, duration) {
      this.codecs = codecs || null;
      this.bitrate = bitrate || 0;
      this.height = height || 0;
      this.width = width || 0;
      this.duration = duration || 0;
  }

  PhoneGap.addConstructor(function() {
      if (typeof navigator.device === "undefined") {
          navigator.device = window.device = new Device();
      }
      if (typeof navigator.device.capture === "undefined") {
          navigator.device.capture = window.device.capture = new Capture();
      }
  });
  };
  if (!PhoneGap.hasResource("contact")) {
  	PhoneGap.addResource("contact");


  /**
  * Contains information about a single contact.
  * @param {DOMString} id unique identifier
  * @param {DOMString} displayName
  * @param {ContactName} name
  * @param {DOMString} nickname
  * @param {ContactField[]} phoneNumbers array of phone numbers
  * @param {ContactField[]} emails array of email addresses
  * @param {ContactAddress[]} addresses array of addresses
  * @param {ContactField[]} ims instant messaging user ids
  * @param {ContactOrganization[]} organizations
  * @param {DOMString} birthday contact's birthday
  * @param {DOMString} note user notes about contact
  * @param {ContactField[]} photos
  * @param {Array.<ContactField>} categories
  * @param {ContactField[]} urls contact's web sites
  */
  var Contact = function(id, displayName, name, nickname, phoneNumbers, emails, addresses,
      ims, organizations, birthday, note, photos, categories, urls) {
      this.id = id || null;
      this.displayName = displayName || null;
      this.name = name || null; // ContactName
      this.nickname = nickname || null;
      this.phoneNumbers = phoneNumbers || null; // ContactField[]
      this.emails = emails || null; // ContactField[]
      this.addresses = addresses || null; // ContactAddress[]
      this.ims = ims || null; // ContactField[]
      this.organizations = organizations || null; // ContactOrganization[]
      this.birthday = birthday || null; // JS Date
      this.note = note || null;
      this.photos = photos || null; // ContactField[]
      this.categories = categories || null; 
      this.urls = urls || null; // ContactField[]
  };

  /**
  * Converts Dates to milliseconds before sending to iOS
  */
  Contact.prototype.convertDatesOut = function()
  {
  	var dates = new Array("birthday");
  	for (var i=0; i<dates.length; i++){
  		var value = this[dates[i]];
  		if (value){
  			if (!value instanceof Date){
  				try {
  					value = new Date(value);
  				} catch(exception){
  					value = null;
  				}
  			}
  			if (value instanceof Date){
  				value = value.valueOf();
  			}
  			this[dates[i]] = value;
  		}
  	}

  };
  /**
  * Converts milliseconds to JS Date when returning from iOS
  */
  Contact.prototype.convertDatesIn = function()
  {
  	var dates = new Array("birthday");
  	for (var i=0; i<dates.length; i++){
  		var value = this[dates[i]];
  		if (value){
  			try {
  				this[dates[i]] = new Date(parseFloat(value));
  			} catch (exception){
  				console.log("exception creating date");
  			}
  		}
  	}
  };
  /**
  * Removes contact from device storage.
  * @param successCB success callback
  * @param errorCB error callback (optional)
  */
  Contact.prototype.remove = function(successCB, errorCB) {
  	if (this.id == null) {
          var errorObj = new ContactError();
          errorObj.code = ContactError.UNKNOWN_ERROR;
          errorCB(errorObj);
      }
      else {
          PhoneGap.exec(successCB, errorCB, "com.phonegap.contacts", "remove", [{ "contact": this}]);
      }
  };
  /**
  * iOS ONLY
  * displays contact via iOS UI
  *	NOT part of W3C spec so no official documentation
  *
  * @param errorCB error callback
  * @param options object
  *	allowsEditing: boolean AS STRING
  *		"true" to allow editing the contact
  *		"false" (default) display contact
  */
  Contact.prototype.display = function(errorCB, options) { 
  	if (this.id == null) {
          if (typeof errorCB == "function") {
          	var errorObj = new ContactError();
          	errorObj.code = ContactError.UNKNOWN_ERROR;
          	errorCB(errorObj);
  		}
      }
      else {
          PhoneGap.exec(null, errorCB, "com.phonegap.contacts","displayContact", [this.id, options]);
      }
  };

  /**
  * Creates a deep copy of this Contact.
  * With the contact ID set to null.
  * @return copy of this Contact
  */
  Contact.prototype.clone = function() {
      var clonedContact = PhoneGap.clone(this);
      clonedContact.id = null;
      // Loop through and clear out any id's in phones, emails, etc.
      if (clonedContact.phoneNumbers) {
      	for (i=0; i<clonedContact.phoneNumbers.length; i++) {
      		clonedContact.phoneNumbers[i].id = null;
      	}
      }
      if (clonedContact.emails) {
      	for (i=0; i<clonedContact.emails.length; i++) {
      		clonedContact.emails[i].id = null;
      	}
      }
      if (clonedContact.addresses) {
      	for (i=0; i<clonedContact.addresses.length; i++) {
      		clonedContact.addresses[i].id = null;
      	}
      }
      if (clonedContact.ims) {
      	for (i=0; i<clonedContact.ims.length; i++) {
      		clonedContact.ims[i].id = null;
      	}
      }
      if (clonedContact.organizations) {
      	for (i=0; i<clonedContact.organizations.length; i++) {
      		clonedContact.organizations[i].id = null;
      	}
      }
      if (clonedContact.photos) {
      	for (i=0; i<clonedContact.photos.length; i++) {
      		clonedContact.photos[i].id = null;
      	}
      }
      if (clonedContact.urls) {
      	for (i=0; i<clonedContact.urls.length; i++) {
      		clonedContact.urls[i].id = null;
      	}
      }
      return clonedContact;
  };

  /**
  * Persists contact to device storage.
  * @param successCB success callback
  * @param errorCB error callback - optional
  */
  Contact.prototype.save = function(successCB, errorCB) {
  	// don't modify the original contact
  	var cloned = PhoneGap.clone(this);
  	cloned.convertDatesOut(); 
  	PhoneGap.exec(successCB, errorCB, "com.phonegap.contacts","save", [{"contact": cloned}]);
  };

  /**
  * Contact name.
  * @param formatted
  * @param familyName
  * @param givenName
  * @param middle
  * @param prefix
  * @param suffix
  */
  var ContactName = function(formatted, familyName, givenName, middle, prefix, suffix) {
      this.formatted = formatted != "undefined" ? formatted : null;
      this.familyName = familyName != "undefined" ? familyName : null;
      this.givenName = givenName != "undefined" ? givenName : null;
      this.middleName = middle != "undefined" ? middle : null;
      this.honorificPrefix = prefix != "undefined" ? prefix : null;
      this.honorificSuffix = suffix != "undefined" ? suffix : null;
  };

  /**
  * Generic contact field.
  * @param type
  * @param value
  * @param pref
  * @param id
  */
  var ContactField = function(type, value, pref, id) {
      this.type = type != "undefined" ? type : null;
      this.value = value != "undefined" ? value : null;
      this.pref = pref != "undefined" ? pref : null;
      this.id = id != "undefined" ? id : null;
  };

  /**
  * Contact address.
  * @param pref - boolean is primary / preferred address
  * @param type - string - work, home…..
  * @param formatted
  * @param streetAddress
  * @param locality
  * @param region
  * @param postalCode
  * @param country
  */
  var ContactAddress = function(pref, type, formatted, streetAddress, locality, region, postalCode, country, id) {
  	this.pref = pref != "undefined" ? pref : null;
  	this.type = type != "undefined" ? type : null;
      this.formatted = formatted != "undefined" ? formatted : null;
      this.streetAddress = streetAddress != "undefined" ? streetAddress : null;
      this.locality = locality != "undefined" ? locality : null;
      this.region = region != "undefined" ? region : null;
      this.postalCode = postalCode != "undefined" ? postalCode : null;
      this.country = country != "undefined" ? country : null;
      this.id = id != "undefined" ? id : null;
  };

  /**
  * Contact organization.
  * @param pref - boolean is primary / preferred address
  * @param type - string - work, home…..
  * @param name
  * @param dept
  * @param title
  */
  var ContactOrganization = function(pref, type, name, dept, title) {
  	this.pref = pref != "undefined" ? pref : null;
  	this.type = type != "undefined" ? type : null;
      this.name = name != "undefined" ? name : null;
      this.department = dept != "undefined" ? dept : null;
      this.title = title != "undefined" ? title : null;
  };

  /**
  * Contact account.
  * @param domain
  * @param username
  * @param userid
  */
  /*var ContactAccount = function(domain, username, userid) {
      this.domain = domain != "undefined" ? domain : null;
      this.username = username != "undefined" ? username : null;
      this.userid = userid != "undefined" ? userid : null;
  }*/

  /**
  * Represents a group of Contacts.
  */
  var Contacts = function() {
      this.inProgress = false;
      this.records = new Array();
  };
  /**
  * Returns an array of Contacts matching the search criteria.
  * @param fields that should be searched
  * @param successCB success callback
  * @param errorCB error callback (optional)
  * @param {ContactFindOptions} options that can be applied to contact searching
  * @return array of Contacts matching search criteria
  */
  Contacts.prototype.find = function(fields, successCB, errorCB, options) {
  	if (successCB === null) {
          throw new TypeError("You must specify a success callback for the find command.");
      }
      if (fields === null || fields === "undefined" || fields.length === "undefined" || fields.length <= 0) {
      	if (typeof errorCB === "function") {
  			errorCB({"code": ContactError.INVALID_ARGUMENT_ERROR});
      	}
      } else {
  		PhoneGap.exec(successCB, errorCB, "com.phonegap.contacts","search", [{"fields":fields, "findOptions":options}]);
      }
  };
  /**
  * need to turn the array of JSON strings representing contact objects into actual objects
  * @param array of JSON strings with contact data
  * @return call results callback with array of Contact objects
  *  This function is called from objective C Contacts.search() method.
  */
  Contacts.prototype._findCallback = function(pluginResult) {
  	var contacts = new Array();
  	try {
  		for (var i=0; i<pluginResult.message.length; i++) {
  			var newContact = navigator.contacts.create(pluginResult.message[i]); 
  			newContact.convertDatesIn();
  			contacts.push(newContact);
  		}
  		pluginResult.message = contacts;
  	} catch(e){
  			console.log("Error parsing contacts: " +e);
  	}
  	return pluginResult;
  }

  /**
  * need to turn the JSON string representing contact object into actual object
  * @param JSON string with contact data
  * Call stored results function with  Contact object
  *  This function is called from objective C Contacts remove and save methods
  */
  Contacts.prototype._contactCallback = function(pluginResult)
  {
  	var newContact = null;
  	if (pluginResult.message){
  		try {
  			newContact = navigator.contacts.create(pluginResult.message);
  			newContact.convertDatesIn();
  		} catch(e){
  			console.log("Error parsing contact");
  		}
  	}
  	pluginResult.message = newContact;
  	return pluginResult;

  };
  /** 
  * Need to return an error object rather than just a single error code
  * @param error code
  * Call optional error callback if found.
  * Called from objective c find, remove, and save methods on error.
  */
  Contacts.prototype._errCallback = function(pluginResult)
  {
  	var errorObj = new ContactError();
     	errorObj.code = pluginResult.message;
  	pluginResult.message = errorObj;
  	return pluginResult;
  };
  // iPhone only api to create a new contact via the GUI
  Contacts.prototype.newContactUI = function(successCallback) { 
      PhoneGap.exec(successCallback, null, "com.phonegap.contacts","newContact", []);
  };
  // iPhone only api to select a contact via the GUI
  Contacts.prototype.chooseContact = function(successCallback, options) {
      PhoneGap.exec(successCallback, null, "com.phonegap.contacts","chooseContact", options);
  };


  /**
  * This function creates a new contact, but it does not persist the contact
  * to device storage. To persist the contact to device storage, invoke
  * contact.save().
  * @param properties an object who's properties will be examined to create a new Contact
  * @returns new Contact object
  */
  Contacts.prototype.create = function(properties) {
      var i;
      var contact = new Contact();
      for (i in properties) {
          if (contact[i] !== 'undefined') {
              contact[i] = properties[i];
          }
      }
      return contact;
  };

  /**
   * ContactFindOptions.
   * @param filter used to match contacts against
   * @param multiple boolean used to determine if more than one contact should be returned
   */
  var ContactFindOptions = function(filter, multiple, updatedSince) {
      this.filter = filter || '';
      this.multiple = multiple || false;
  };

  /**
   *  ContactError.
   *  An error code assigned by an implementation when an error has occurred
   */
  var ContactError = function() {
      this.code=null;
  };

  /**
   * Error codes
   */
  ContactError.UNKNOWN_ERROR = 0;
  ContactError.INVALID_ARGUMENT_ERROR = 1;
  ContactError.TIMEOUT_ERROR = 2;
  ContactError.PENDING_OPERATION_ERROR = 3;
  ContactError.IO_ERROR = 4;
  ContactError.NOT_SUPPORTED_ERROR = 5;
  ContactError.PERMISSION_DENIED_ERROR = 20;

  /**
   * Add the contact interface into the browser.
   */
  PhoneGap.addConstructor(function() { 
      if(typeof navigator.contacts == "undefined") {
      	navigator.contacts = new Contacts();
      }
  });
  };
  if (!PhoneGap.hasResource("file")) {
  	PhoneGap.addResource("file");

  /**
   * This class provides generic read and write access to the mobile device file system.
   * They are not used to read files from a server.
   */

  /**
   * This class provides some useful information about a file.
   * This is the fields returned when navigator.fileMgr.getFileProperties() 
   * is called.
   */
  FileProperties = function(filePath) {
      this.filePath = filePath;
      this.size = 0;
      this.lastModifiedDate = null;
  }
  /**
   * Represents a single file.
   * 
   * name {DOMString} name of the file, without path information
   * fullPath {DOMString} the full path of the file, including the name
   * type {DOMString} mime type
   * lastModifiedDate {Date} last modified date
   * size {Number} size of the file in bytes
   */
  File = function(name, fullPath, type, lastModifiedDate, size) {
  	this.name = name || null;
      this.fullPath = fullPath || null;
  	this.type = type || null;
      this.lastModifiedDate = lastModifiedDate || null;
      this.size = size || 0;
  }
  /**
   * Create an event object since we can't set target on DOM event.
   *
   * @param type
   * @param target
   *
   */
  File._createEvent = function(type, target) {
      // Can't create event object, since we can't set target (its readonly)
      //var evt = document.createEvent('Events');
      //evt.initEvent("onload", false, false);
      var evt = {"type": type};
      evt.target = target;
      return evt;
  };

  FileError = function() {
     this.code = null;
  }

  // File error codes
  // Found in DOMException
  FileError.NOT_FOUND_ERR = 1;
  FileError.SECURITY_ERR = 2;
  FileError.ABORT_ERR = 3;

  // Added by this specification
  FileError.NOT_READABLE_ERR = 4;
  FileError.ENCODING_ERR = 5;
  FileError.NO_MODIFICATION_ALLOWED_ERR = 6;
  FileError.INVALID_STATE_ERR = 7;
  FileError.SYNTAX_ERR = 8;
  FileError.INVALID_MODIFICATION_ERR = 9;
  FileError.QUOTA_EXCEEDED_ERR = 10;
  FileError.TYPE_MISMATCH_ERR = 11;
  FileError.PATH_EXISTS_ERR = 12;

  //-----------------------------------------------------------------------------
  // File manager
  //-----------------------------------------------------------------------------

  FileMgr = function() {
  }

  FileMgr.prototype.testFileExists = function(fileName, successCallback, errorCallback) {
      PhoneGap.exec(successCallback, errorCallback, "com.phonegap.file", "testFileExists", [fileName]);
  };

  FileMgr.prototype.testDirectoryExists = function(dirName, successCallback, errorCallback) {
      PhoneGap.exec(successCallback, errorCallback, "com.phonegap.file", "testDirectoryExists", [dirName]);
  };

  FileMgr.prototype.getFreeDiskSpace = function(successCallback, errorCallback) {
      PhoneGap.exec(successCallback, errorCallback, "com.phonegap.file", "getFreeDiskSpace", []);
  };

  FileMgr.prototype.write = function(fileName, data, position, successCallback, errorCallback) {
      PhoneGap.exec(successCallback, errorCallback, "com.phonegap.file", "write", [fileName, data, position]);
  };

  FileMgr.prototype.truncate = function(fileName, size, successCallback, errorCallback) {
      PhoneGap.exec(successCallback, errorCallback, "com.phonegap.file", "truncateFile", [fileName, size]);
  };

  FileMgr.prototype.readAsText = function(fileName, encoding, successCallback, errorCallback) {
      PhoneGap.exec(successCallback, errorCallback, "com.phonegap.file", "readFile", [fileName, encoding]);
  };

  FileMgr.prototype.readAsDataURL = function(fileName, successCallback, errorCallback) {
  	PhoneGap.exec(successCallback, errorCallback, "com.phonegap.file", "readAsDataURL", [fileName]);
  };

  PhoneGap.addConstructor(function() {
      if (typeof navigator.fileMgr === "undefined") {
          navigator.fileMgr = new FileMgr();
      }
  });


  //-----------------------------------------------------------------------------
  // File Reader
  //-----------------------------------------------------------------------------

  /**
   * This class reads the mobile device file system.
   *
   */
  FileReader = function() {
      this.fileName = "";

      this.readyState = 0;

      // File data
      this.result = null;

      // Error
      this.error = null;

      // Event handlers
      this.onloadstart = null;    // When the read starts.
      this.onprogress = null;     // While reading (and decoding) file or fileBlob data, and reporting partial file data (progess.loaded/progress.total)
      this.onload = null;         // When the read has successfully completed.
      this.onerror = null;        // When the read has failed (see errors).
      this.onloadend = null;      // When the request has completed (either in success or failure).
      this.onabort = null;        // When the read has been aborted. For instance, by invoking the abort() method.
  }

  // States
  FileReader.EMPTY = 0;
  FileReader.LOADING = 1;
  FileReader.DONE = 2;

  /**
   * Abort reading file.
   */
  FileReader.prototype.abort = function() {
      var evt;
      this.readyState = FileReader.DONE;
      this.result = null;

      // set error
      var error = new FileError();
      error.code = error.ABORT_ERR;
      this.error = error;

      // If error callback
      if (typeof this.onerror === "function") {
          evt = File._createEvent("error", this);
          this.onerror(evt);
      }
      // If abort callback
      if (typeof this.onabort === "function") {
          evt = File._createEvent("abort", this);
          this.onabort(evt);
      }
      // If load end callback
      if (typeof this.onloadend === "function") {
          evt = File._createEvent("loadend", this);
          this.onloadend(evt);
      }
  };

  /**
   * Read text file.
   *
   * @param file          The name of the file
   * @param encoding      [Optional] (see http://www.iana.org/assignments/character-sets)
   */
  FileReader.prototype.readAsText = function(file, encoding) {
      this.fileName = "";
  	if (typeof file.fullPath === "undefined") {
  		this.fileName = file;
  	} else {
  		this.fileName = file.fullPath;
  	}

      // LOADING state
      this.readyState = FileReader.LOADING;

      // If loadstart callback
      if (typeof this.onloadstart === "function") {
          var evt = File._createEvent("loadstart", this);
          this.onloadstart(evt);
      }

      // Default encoding is UTF-8
      var enc = encoding ? encoding : "UTF-8";

      var me = this;

      // Read file
      navigator.fileMgr.readAsText(this.fileName, enc,

          // Success callback
          function(r) {
              var evt;

              // If DONE (cancelled), then don't do anything
              if (me.readyState === FileReader.DONE) {
                  return;
              }

              // Save result
              me.result = decodeURIComponent(r);

              // If onload callback
              if (typeof me.onload === "function") {
                  evt = File._createEvent("load", me);
                  me.onload(evt);
              }

              // DONE state
              me.readyState = FileReader.DONE;

              // If onloadend callback
              if (typeof me.onloadend === "function") {
                  evt = File._createEvent("loadend", me);
                  me.onloadend(evt);
              }
          },

          // Error callback
          function(e) {
              var evt;
              // If DONE (cancelled), then don't do anything
              if (me.readyState === FileReader.DONE) {
                  return;
              }

              // Save error
              me.error = e;

              // If onerror callback
              if (typeof me.onerror === "function") {
                  evt = File._createEvent("error", me);
                  me.onerror(evt);
              }

              // DONE state
              me.readyState = FileReader.DONE;

              // If onloadend callback
              if (typeof me.onloadend === "function") {
                  evt = File._createEvent("loadend", me);
                  me.onloadend(evt);
              }
          }
          );
  };


  /**
   * Read file and return data as a base64 encoded data url.
   * A data url is of the form:
   *      data:[<mediatype>][;base64],<data>
   *
   * @param file          {File} File object containing file properties
   */
  FileReader.prototype.readAsDataURL = function(file) {
      this.fileName = "";

      if (typeof file.fullPath === "undefined") {
          this.fileName = file;
      } else {
          this.fileName = file.fullPath;
      }

      // LOADING state
      this.readyState = FileReader.LOADING;

      // If loadstart callback
      if (typeof this.onloadstart === "function") {
          var evt = File._createEvent("loadstart", this);
          this.onloadstart(evt);
      }

      var me = this;

      // Read file
      navigator.fileMgr.readAsDataURL(this.fileName,

          // Success callback
          function(r) {
              var evt;

              // If DONE (cancelled), then don't do anything
              if (me.readyState === FileReader.DONE) {
                  return;
              }

              // Save result
              me.result = r;

              // If onload callback
              if (typeof me.onload === "function") {
                  evt = File._createEvent("load", me);
                  me.onload(evt);
              }

              // DONE state
              me.readyState = FileReader.DONE;

              // If onloadend callback
              if (typeof me.onloadend === "function") {
                  evt = File._createEvent("loadend", me);
                  me.onloadend(evt);
              }
          },

          // Error callback
          function(e) {
              var evt;
              // If DONE (cancelled), then don't do anything
              if (me.readyState === FileReader.DONE) {
                  return;
              }

              // Save error
              me.error = e;

              // If onerror callback
              if (typeof me.onerror === "function") {
                  evt = File._createEvent("error", me);
                  me.onerror(evt);
              }

              // DONE state
              me.readyState = FileReader.DONE;

              // If onloadend callback
              if (typeof me.onloadend === "function") {
                  evt = File._createEvent("loadend", me);
                  me.onloadend(evt);
              }
          }
          );
  };

  /**
   * Read file and return data as a binary data.
   *
   * @param file          The name of the file
   */
  FileReader.prototype.readAsBinaryString = function(file) {
      // TODO - Can't return binary data to browser.
      this.fileName = file;
  };

  /**
   * Read file and return data as a binary data.
   *
   * @param file          The name of the file
   */
  FileReader.prototype.readAsArrayBuffer = function(file) {
      // TODO - Can't return binary data to browser.
      this.fileName = file;
  };

  //-----------------------------------------------------------------------------
  // File Writer
  //-----------------------------------------------------------------------------

  /**
   * This class writes to the mobile device file system.
   *
    @param file {File} a File object representing a file on the file system
  */
  FileWriter = function(file) {
      this.fileName = "";
      this.length = 0;
  	if (file) {
  	    this.fileName = file.fullPath || file;
  	    this.length = file.size || 0;
  	}

  	// default is to write at the beginning of the file
      this.position = 0;

      this.readyState = 0; // EMPTY

      this.result = null;

      // Error
      this.error = null;

      // Event handlers
      this.onwritestart = null;	// When writing starts
      this.onprogress = null;		// While writing the file, and reporting partial file data
      this.onwrite = null;		// When the write has successfully completed.
      this.onwriteend = null;		// When the request has completed (either in success or failure).
      this.onabort = null;		// When the write has been aborted. For instance, by invoking the abort() method.
      this.onerror = null;		// When the write has failed (see errors).
  }

  // States
  FileWriter.INIT = 0;
  FileWriter.WRITING = 1;
  FileWriter.DONE = 2;

  /**
   * Abort writing file.
   */
  FileWriter.prototype.abort = function() {
      // check for invalid state
  	if (this.readyState === FileWriter.DONE || this.readyState === FileWriter.INIT) {
  		throw FileError.INVALID_STATE_ERR;
  	} 

      // set error
      var error = new FileError(), evt;
      error.code = error.ABORT_ERR;
      this.error = error;

      // If error callback
      if (typeof this.onerror === "function") {
          evt = File._createEvent("error", this);
          this.onerror(evt);
      }
      // If abort callback
      if (typeof this.onabort === "function") {
          evt = File._createEvent("abort", this);
          this.onabort(evt);
      }

      this.readyState = FileWriter.DONE;

      // If write end callback
      if (typeof this.onwriteend == "function") {
          evt = File._createEvent("writeend", this);
          this.onwriteend(evt);
      }
  };

  /**
   * @Deprecated: use write instead
   * 
   * @param file to write the data to
   * @param text to be written
   * @param bAppend if true write to end of file, otherwise overwrite the file
   */
  FileWriter.prototype.writeAsText = function(file, text, bAppend) {
  	// Throw an exception if we are already writing a file
  	if (this.readyState === FileWriter.WRITING) {
  		throw FileError.INVALID_STATE_ERR;
  	}

  	if (bAppend !== true) {
          bAppend = false; // for null values
      }

      this.fileName = file;

      // WRITING state
      this.readyState = FileWriter.WRITING;

      var me = this;

      // If onwritestart callback
      if (typeof me.onwritestart === "function") {
          var evt = File._createEvent("writestart", me);
          me.onwritestart(evt);
      }


      // Write file 
  	navigator.fileMgr.writeAsText(file, text, bAppend,
          // Success callback
          function(r) {
              var evt;

              // If DONE (cancelled), then don't do anything
              if (me.readyState === FileWriter.DONE) {
                  return;
              }

              // Save result
              me.result = r;

              // If onwrite callback
              if (typeof me.onwrite === "function") {
                  evt = File._createEvent("write", me);
                  me.onwrite(evt);
              }

              // DONE state
              me.readyState = FileWriter.DONE;

              // If onwriteend callback
              if (typeof me.onwriteend === "function") {
                  evt = File._createEvent("writeend", me);
                  me.onwriteend(evt);
              }
          },

          // Error callback
          function(e) {
              var evt;

              // If DONE (cancelled), then don't do anything
              if (me.readyState === FileWriter.DONE) {
                  return;
              }

              // Save error
              me.error = e;

              // If onerror callback
              if (typeof me.onerror === "function") {
                  evt = File._createEvent("error", me);
                  me.onerror(evt);
              }

              // DONE state
              me.readyState = FileWriter.DONE;

              // If onwriteend callback
              if (typeof me.onwriteend === "function") {
                  evt = File._createEvent("writeend", me);
                  me.onwriteend(evt);
              }
          }
      );
  };

  /**
   * Writes data to the file
   *  
   * @param text to be written
   */
  FileWriter.prototype.write = function(text) {
  	// Throw an exception if we are already writing a file
  	if (this.readyState === FileWriter.WRITING) {
  		throw FileError.INVALID_STATE_ERR;
  	}

      // WRITING state
      this.readyState = FileWriter.WRITING;

      var me = this;

      // If onwritestart callback
      if (typeof me.onwritestart === "function") {
          var evt = File._createEvent("writestart", me);
          me.onwritestart(evt);
      }

      // Write file
      navigator.fileMgr.write(this.fileName, text, this.position,

          // Success callback
          function(r) {
              var evt;
              // If DONE (cancelled), then don't do anything
              if (me.readyState === FileWriter.DONE) {
                  return;
              }


              // position always increases by bytes written because file would be extended
              me.position += r;
  			// The length of the file is now where we are done writing.
  			me.length = me.position;

              // If onwrite callback
              if (typeof me.onwrite === "function") {
                  evt = File._createEvent("write", me);
                  me.onwrite(evt);
              }

              // DONE state
              me.readyState = FileWriter.DONE;

              // If onwriteend callback
              if (typeof me.onwriteend === "function") {
                  evt = File._createEvent("writeend", me);
                  me.onwriteend(evt);
              }
          },

          // Error callback
          function(e) {
              var evt;

              // If DONE (cancelled), then don't do anything
              if (me.readyState === FileWriter.DONE) {
                  return;
              }

              // Save error
              me.error = e;

              // If onerror callback
              if (typeof me.onerror === "function") {
                  evt = File._createEvent("error", me);
                  me.onerror(evt);
              }

              // DONE state
              me.readyState = FileWriter.DONE;

              // If onwriteend callback
              if (typeof me.onwriteend === "function") {
                  evt = File._createEvent("writeend", me);
                  me.onwriteend(evt);
              }
          }
          );

  };

  /** 
   * Moves the file pointer to the location specified.
   * 
   * If the offset is a negative number the position of the file 
   * pointer is rewound.  If the offset is greater than the file 
   * size the position is set to the end of the file.  
   * 
   * @param offset is the location to move the file pointer to.
   */
  FileWriter.prototype.seek = function(offset) {
      // Throw an exception if we are already writing a file
      if (this.readyState === FileWriter.WRITING) {
          throw FileError.INVALID_STATE_ERR;
      }

      if (!offset) {
          return;
      }

      // See back from end of file.
      if (offset < 0) {
  		this.position = Math.max(offset + this.length, 0);
  	}
      // Offset is bigger then file size so set position 
      // to the end of the file.
  	else if (offset > this.length) {
  		this.position = this.length;
  	}
      // Offset is between 0 and file size so set the position
      // to start writing.
  	else {
  		this.position = offset;
  	}	
  };

  /** 
   * Truncates the file to the size specified.
   * 
   * @param size to chop the file at.
   */
  FileWriter.prototype.truncate = function(size) {
  	// Throw an exception if we are already writing a file
  	if (this.readyState === FileWriter.WRITING) {
  		throw FileError.INVALID_STATE_ERR;
  	}
  	// what if no size specified? 

      // WRITING state
      this.readyState = FileWriter.WRITING;

      var me = this;

      // If onwritestart callback
      if (typeof me.onwritestart === "function") {
          var evt = File._createEvent("writestart", me);
          me.onwritestart(evt);
      }

      // Write file
      navigator.fileMgr.truncate(this.fileName, size,

          // Success callback
          function(r) {
              var evt;
              // If DONE (cancelled), then don't do anything
              if (me.readyState === FileWriter.DONE) {
                  return;
              }

              // Update the length of the file
              me.length = r;
              me.position = Math.min(me.position, r);

              // If onwrite callback
              if (typeof me.onwrite === "function") {
                  evt = File._createEvent("write", me);
                  me.onwrite(evt);
              }

              // DONE state
              me.readyState = FileWriter.DONE;

              // If onwriteend callback
              if (typeof me.onwriteend === "function") {
                  evt = File._createEvent("writeend", me);
                  me.onwriteend(evt);
              }
          },

          // Error callback
          function(e) {
              var evt;
              // If DONE (cancelled), then don't do anything
              if (me.readyState === FileWriter.DONE) {
                  return;
              }

              // Save error
              me.error = e;

              // If onerror callback
              if (typeof me.onerror === "function") {
                  evt = File._createEvent("error", me);
                  me.onerror(evt);
              }

              // DONE state
              me.readyState = FileWriter.DONE;

              // If onwriteend callback
              if (typeof me.onwriteend === "function") {
                  evt = File._createEvent("writeend", me);
                  me.onwriteend(evt);
              }
          }
      );
  };

  LocalFileSystem = function() {
  };

  // File error codes
  LocalFileSystem.TEMPORARY = 0;
  LocalFileSystem.PERSISTENT = 1;
  LocalFileSystem.RESOURCE = 2;
  LocalFileSystem.APPLICATION = 3;

  /**
   * Requests a filesystem in which to store application data.
   * 
   * @param {int} type of file system being requested
   * @param {Function} successCallback is called with the new FileSystem
   * @param {Function} errorCallback is called with a FileError
   */
  LocalFileSystem.prototype.requestFileSystem = function(type, size, successCallback, errorCallback) {
  	if (type < 0 || type > 3) {
  		if (typeof errorCallback == "function") {
  			errorCallback({
  				"code": FileError.SYNTAX_ERR
  			});
  		}
  	}
  	else {
  		PhoneGap.exec(successCallback, errorCallback, "com.phonegap.file", "requestFileSystem", [type, size]);
  	}
  };

  /**
   * 
   * @param {DOMString} uri referring to a local file in a filesystem
   * @param {Function} successCallback is called with the new entry
   * @param {Function} errorCallback is called with a FileError
   */
  LocalFileSystem.prototype.resolveLocalFileSystemURI = function(uri, successCallback, errorCallback) {
      PhoneGap.exec(successCallback, errorCallback, "com.phonegap.file", "resolveLocalFileSystemURI", [uri]);
  };

  /**
  * This function  is required as we need to convert raw 
  * JSON objects into concrete File and Directory objects.  
  * 
  * @param a JSON Objects that need to be converted to DirectoryEntry or FileEntry objects.
  * @returns an entry 
  */
  LocalFileSystem.prototype._castFS = function(pluginResult) {
      var entry = null;
      entry = new DirectoryEntry();
      entry.isDirectory = pluginResult.message.root.isDirectory;
      entry.isFile = pluginResult.message.root.isFile;
      entry.name = pluginResult.message.root.name;
      entry.fullPath = pluginResult.message.root.fullPath;
      pluginResult.message.root = entry;
      return pluginResult;    
  }

  LocalFileSystem.prototype._castEntry = function(pluginResult) {
      var entry = null;
      if (pluginResult.message.isDirectory) {
          entry = new DirectoryEntry();
      }
      else if (pluginResult.message.isFile) {
  		entry = new FileEntry();
      }
      entry.isDirectory = pluginResult.message.isDirectory;
      entry.isFile = pluginResult.message.isFile;
      entry.name = pluginResult.message.name;
      entry.fullPath = pluginResult.message.fullPath;
      pluginResult.message = entry;
      return pluginResult;    
  }

  LocalFileSystem.prototype._castEntries = function(pluginResult) {
      var entries = pluginResult.message;
  	var retVal = []; 
  	for (i=0; i<entries.length; i++) {
  		retVal.push(window.localFileSystem._createEntry(entries[i]));
  	}
      pluginResult.message = retVal;
      return pluginResult;    
  }

  LocalFileSystem.prototype._createEntry = function(castMe) {
  	var entry = null;
      if (castMe.isDirectory) {
          entry = new DirectoryEntry();
      }
      else if (castMe.isFile) {
          entry = new FileEntry();
      }
      entry.isDirectory = castMe.isDirectory;
      entry.isFile = castMe.isFile;
      entry.name = castMe.name;
      entry.fullPath = castMe.fullPath;
      return entry;    

  }

  LocalFileSystem.prototype._castDate = function(pluginResult) {
  	if (pluginResult.message.modificationTime) {
  		var metadataObj = new Metadata();

  	    metadataObj.modificationTime = new Date(pluginResult.message.modificationTime);
  	    pluginResult.message = metadataObj;
  	}
  	else if (pluginResult.message.lastModifiedDate) {
  		var file = new File();
          file.size = pluginResult.message.size;
          file.type = pluginResult.message.type;
          file.name = pluginResult.message.name;
          file.fullPath = pluginResult.message.fullPath;
  		file.lastModifiedDate = new Date(pluginResult.message.lastModifiedDate);
  	    pluginResult.message = file;		
  	}

      return pluginResult;	
  }
  LocalFileSystem.prototype._castError = function(pluginResult) {
  	var fileError = new FileError();
  	fileError.code = pluginResult.message;
  	pluginResult.message = fileError;
  	return pluginResult;
  }

  /**
   * Information about the state of the file or directory
   * 
   * {Date} modificationTime (readonly)
   */
  Metadata = function() {
      this.modificationTime=null;
  };

  /**
   * Supplies arguments to methods that lookup or create files and directories
   * 
   * @param {boolean} create file or directory if it doesn't exist 
   * @param {boolean} exclusive if true the command will fail if the file or directory exists
   */
  Flags = function(create, exclusive) {
      this.create = create || false;
      this.exclusive = exclusive || false;
  };

  /**
   * An interface representing a file system
   * 
   * {DOMString} name the unique name of the file system (readonly)
   * {DirectoryEntry} root directory of the file system (readonly)
   */
  FileSystem = function() {
      this.name = null;
      this.root = null;
  };

  /**
   * An interface representing a directory on the file system.
   * 
   * {boolean} isFile always false (readonly)
   * {boolean} isDirectory always true (readonly)
   * {DOMString} name of the directory, excluding the path leading to it (readonly)
   * {DOMString} fullPath the absolute full path to the directory (readonly)
   * {FileSystem} filesystem on which the directory resides (readonly)
   */
  DirectoryEntry = function() {
      this.isFile = false;
      this.isDirectory = true;
      this.name = null;
      this.fullPath = null;
      this.filesystem = null;
  };

  /**
   * Copies a directory to a new location
   * 
   * @param {DirectoryEntry} parent the directory to which to copy the entry
   * @param {DOMString} newName the new name of the entry, defaults to the current name
   * @param {Function} successCallback is called with the new entry
   * @param {Function} errorCallback is called with a FileError
   */
  DirectoryEntry.prototype.copyTo = function(parent, newName, successCallback, errorCallback) {
      PhoneGap.exec(successCallback, errorCallback, "com.phonegap.file", "copyTo", [this.fullPath, parent, newName]);
  };

  /**
   * Looks up the metadata of the entry
   * 
   * @param {Function} successCallback is called with a Metadata object
   * @param {Function} errorCallback is called with a FileError
   */
  DirectoryEntry.prototype.getMetadata = function(successCallback, errorCallback) {
      PhoneGap.exec(successCallback, errorCallback, "com.phonegap.file", "getMetadata", [this.fullPath]);
  };

  /**
   * Gets the parent of the entry
   * 
   * @param {Function} successCallback is called with a parent entry
   * @param {Function} errorCallback is called with a FileError
   */
  DirectoryEntry.prototype.getParent = function(successCallback, errorCallback) {
      PhoneGap.exec(successCallback, errorCallback, "com.phonegap.file", "getParent", [this.fullPath]);
  };

  /**
   * Moves a directory to a new location
   * 
   * @param {DirectoryEntry} parent the directory to which to move the entry
   * @param {DOMString} newName the new name of the entry, defaults to the current name
   * @param {Function} successCallback is called with the new entry
   * @param {Function} errorCallback is called with a FileError
   */
  DirectoryEntry.prototype.moveTo = function(parent, newName, successCallback, errorCallback) {
      PhoneGap.exec(successCallback, errorCallback, "com.phonegap.file", "moveTo", [this.fullPath, parent, newName]);
  };

  /**
   * Removes the entry
   * 
   * @param {Function} successCallback is called with no parameters
   * @param {Function} errorCallback is called with a FileError
   */
  DirectoryEntry.prototype.remove = function(successCallback, errorCallback) {
      PhoneGap.exec(successCallback, errorCallback, "com.phonegap.file", "remove", [this.fullPath]);
  };

  /**
   * Returns a URI that can be used to identify this entry.
   * 
   * @param {DOMString} mimeType for a FileEntry, the mime type to be used to interpret the file, when loaded through this URI.
   * @param {Function} successCallback is called with the new entry
   * @param {Function} errorCallback is called with a FileError
   */
  DirectoryEntry.prototype.toURI = function(mimeType, successCallback, errorCallback) {
      return "file://localhost" + this.fullPath;
      //PhoneGap.exec(successCallback, errorCallback, "com.phonegap.file", "toURI", [this.fullPath, mimeType]);
  };

  /**
   * Creates a new DirectoryReader to read entries from this directory
   */
  DirectoryEntry.prototype.createReader = function(successCallback, errorCallback) {
      return new DirectoryReader(this.fullPath);
  };

  /**
   * Creates or looks up a directory
   * 
   * @param {DOMString} path either a relative or absolute path from this directory in which to look up or create a directory
   * @param {Flags} options to create or excluively create the directory
   * @param {Function} successCallback is called with the new entry
   * @param {Function} errorCallback is called with a FileError
   */
  DirectoryEntry.prototype.getDirectory = function(path, options, successCallback, errorCallback) {
      PhoneGap.exec(successCallback, errorCallback, "com.phonegap.file", "getDirectory", [this.fullPath, path, options]);
  };

  /**
   * Creates or looks up a file
   * 
   * @param {DOMString} path either a relative or absolute path from this directory in which to look up or create a file
   * @param {Flags} options to create or excluively create the file
   * @param {Function} successCallback is called with the new entry
   * @param {Function} errorCallback is called with a FileError
   */
  DirectoryEntry.prototype.getFile = function(path, options, successCallback, errorCallback) {
      PhoneGap.exec(successCallback, errorCallback, "com.phonegap.file", "getFile", [this.fullPath, path, options]);
  };

  /**
   * Deletes a directory and all of it's contents
   * 
   * @param {Function} successCallback is called with no parameters
   * @param {Function} errorCallback is called with a FileError
   */
  DirectoryEntry.prototype.removeRecursively = function(successCallback, errorCallback) {
      PhoneGap.exec(successCallback, errorCallback, "com.phonegap.file", "removeRecursively", [this.fullPath]);
  };

  /**
   * An interface that lists the files and directories in a directory.
   */
  DirectoryReader = function(fullPath){
  	this.fullPath = fullPath || null;    
  };

  /**
   * Returns a list of entries from a directory.
   * 
   * @param {Function} successCallback is called with a list of entries
   * @param {Function} errorCallback is called with a FileError
   */
  DirectoryReader.prototype.readEntries = function(successCallback, errorCallback) {
      PhoneGap.exec(successCallback, errorCallback, "com.phonegap.file", "readEntries", [this.fullPath]);
  }

  /**
   * An interface representing a directory on the file system.
   * 
   * {boolean} isFile always true (readonly)
   * {boolean} isDirectory always false (readonly)
   * {DOMString} name of the file, excluding the path leading to it (readonly)
   * {DOMString} fullPath the absolute full path to the file (readonly)
   * {FileSystem} filesystem on which the directory resides (readonly)
   */
  FileEntry = function() {
      this.isFile = true;
      this.isDirectory = false;
      this.name = null;
      this.fullPath = null;
      this.filesystem = null;
  };

  /**
   * Copies a file to a new location
   * 
   * @param {DirectoryEntry} parent the directory to which to copy the entry
   * @param {DOMString} newName the new name of the entry, defaults to the current name
   * @param {Function} successCallback is called with the new entry
   * @param {Function} errorCallback is called with a FileError
   */
  FileEntry.prototype.copyTo = function(parent, newName, successCallback, errorCallback) {
      PhoneGap.exec(successCallback, errorCallback, "com.phonegap.file", "copyTo", [this.fullPath, parent, newName]);
  };

  /**
   * Looks up the metadata of the entry
   * 
   * @param {Function} successCallback is called with a Metadata object
   * @param {Function} errorCallback is called with a FileError
   */
  FileEntry.prototype.getMetadata = function(successCallback, errorCallback) {
      PhoneGap.exec(successCallback, errorCallback, "com.phonegap.file", "getMetadata", [this.fullPath]);
  };

  /**
   * Gets the parent of the entry
   * 
   * @param {Function} successCallback is called with a parent entry
   * @param {Function} errorCallback is called with a FileError
   */
  FileEntry.prototype.getParent = function(successCallback, errorCallback) {
      PhoneGap.exec(successCallback, errorCallback, "com.phonegap.file", "getParent", [this.fullPath]);
  };

  /**
   * Moves a directory to a new location
   * 
   * @param {DirectoryEntry} parent the directory to which to move the entry
   * @param {DOMString} newName the new name of the entry, defaults to the current name
   * @param {Function} successCallback is called with the new entry
   * @param {Function} errorCallback is called with a FileError
   */
  FileEntry.prototype.moveTo = function(parent, newName, successCallback, errorCallback) {
      PhoneGap.exec(successCallback, errorCallback, "com.phonegap.file", "moveTo", [this.fullPath, parent, newName]);
  };

  /**
   * Removes the entry
   * 
   * @param {Function} successCallback is called with no parameters
   * @param {Function} errorCallback is called with a FileError
   */
  FileEntry.prototype.remove = function(successCallback, errorCallback) {
      PhoneGap.exec(successCallback, errorCallback, "com.phonegap.file", "remove", [this.fullPath]);
  };

  /**
   * Returns a URI that can be used to identify this entry.
   * 
   * @param {DOMString} mimeType for a FileEntry, the mime type to be used to interpret the file, when loaded through this URI.
   * @param {Function} successCallback is called with the new entry
   * @param {Function} errorCallback is called with a FileError
   */
  FileEntry.prototype.toURI = function(mimeType, successCallback, errorCallback) {
      return "file://localhost" + this.fullPath;
      //PhoneGap.exec(successCallback, errorCallback, "com.phonegap.file", "toURI", [this.fullPath, mimeType]);
  };

  /**
   * Creates a new FileWriter associated with the file that this FileEntry represents.
   * 
   * @param {Function} successCallback is called with the new FileWriter
   * @param {Function} errorCallback is called with a FileError
   */
  FileEntry.prototype.createWriter = function(successCallback, errorCallback) {
  	this.file(function(filePointer) {	
  		var writer = new FileWriter(filePointer);
  		if (writer.fileName == null || writer.fileName == "") {
  			if (typeof errorCallback == "function") {
  				errorCallback({
  					"code": FileError.INVALID_STATE_ERR
  				});
  		}
  		}
  		if (typeof successCallback == "function") {
  			successCallback(writer);
  		}       
  	}, errorCallback);
  };

  /**
   * Returns a File that represents the current state of the file that this FileEntry represents.
   * 
   * @param {Function} successCallback is called with the new File object
   * @param {Function} errorCallback is called with a FileError
   */
  FileEntry.prototype.file = function(successCallback, errorCallback) {
      PhoneGap.exec(successCallback, errorCallback, "com.phonegap.file", "getFileMetadata", [this.fullPath]);
  };

  /**
   * Add the FileSystem interface into the browser.
   */
  PhoneGap.addConstructor(function() {
  	var pgLocalFileSystem = new LocalFileSystem();
  	// Needed for cast methods
      if(typeof window.localFileSystem == "undefined") window.localFileSystem  = pgLocalFileSystem;
      if(typeof window.requestFileSystem == "undefined") window.requestFileSystem  = pgLocalFileSystem.requestFileSystem;
      if(typeof window.resolveLocalFileSystemURI == "undefined") window.resolveLocalFileSystemURI = pgLocalFileSystem.resolveLocalFileSystemURI;
  });
  };




  /*
   * PhoneGap is available under *either* the terms of the modified BSD license *or* the
   * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
   *  
   * Copyright (c) 2005-2011, Nitobi Software Inc.
   * Copyright (c) 2011, Matt Kane
   */

  if (!PhoneGap.hasResource("filetransfer")) {
  	PhoneGap.addResource("filetransfer");

  /**
   * FileTransfer uploads a file to a remote server.
   */
  FileTransfer = function() {}

  /**
   * FileUploadResult
   */
  FileUploadResult = function() {
      this.bytesSent = 0;
      this.responseCode = null;
      this.response = null;
  }

  /**
   * FileTransferError
   */
  FileTransferError = function(errorCode) {
      this.code = errorCode || null;
  }

  FileTransferError.FILE_NOT_FOUND_ERR = 1;
  FileTransferError.INVALID_URL_ERR = 2;
  FileTransferError.CONNECTION_ERR = 3;

  /**
  * Given an absolute file path, uploads a file on the device to a remote server 
  * using a multipart HTTP request.
  * @param filePath {String}           Full path of the file on the device
  * @param server {String}             URL of the server to receive the file
  * @param successCallback (Function}  Callback to be invoked when upload has completed
  * @param errorCallback {Function}    Callback to be invoked upon error
  * @param options {FileUploadOptions} Optional parameters such as file name and mimetype           
  */
  FileTransfer.prototype.upload = function(filePath, server, successCallback, errorCallback, options) {
  	if(!options.params) {
  		options.params = {};
  	}
  	options.filePath = filePath;
  	options.server = server;
  	if(!options.fileKey) {
  		options.fileKey = 'file';
  	}
  	if(!options.fileName) {
  		options.fileName = 'image.jpg';
  	}
  	if(!options.mimeType) {
  		options.mimeType = 'image/jpeg';
  	}

  	// successCallback required
  	if (typeof successCallback != "function") {
          console.log("FileTransfer Error: successCallback is not a function");
          return;
      }


      // errorCallback optional
      if (errorCallback && (typeof errorCallback != "function")) {
          console.log("FileTransfer Error: errorCallback is not a function");
          return;
      }

      PhoneGap.exec(successCallback, errorCallback, 'com.phonegap.filetransfer', 'upload', [options]);
  };

  FileTransfer.prototype._castTransferError = function(pluginResult) {
  	var fileError = new FileTransferError(pluginResult.message);
  	//fileError.code = pluginResult.message;
  	pluginResult.message = fileError;
  	return pluginResult;
  }

  FileTransfer.prototype._castUploadResult = function(pluginResult) {
  	var result = new FileUploadResult();
  	result.bytesSent = pluginResult.message.bytesSent;
  	result.responseCode = pluginResult.message.responseCode;
  	result.response = decodeURIComponent(pluginResult.message.response);
  	pluginResult.message = result;
  	return pluginResult;
  }

  /**
   * Options to customize the HTTP request used to upload files.
   * @param fileKey {String}   Name of file request parameter.
   * @param fileName {String}  Filename to be used by the server. Defaults to image.jpg.
   * @param mimeType {String}  Mimetype of the uploaded file. Defaults to image/jpeg.
   * @param params {Object}    Object with key: value params to send to the server.
   */
  FileUploadOptions = function(fileKey, fileName, mimeType, params) {
      this.fileKey = fileKey || null;
      this.fileName = fileName || null;
      this.mimeType = mimeType || null;
      this.params = params || null;
  }


  PhoneGap.addConstructor(function() {
      if (typeof navigator.fileTransfer == "undefined") navigator.fileTransfer = new FileTransfer();
  });
  };
  if (!PhoneGap.hasResource("geolocation")) {
  	PhoneGap.addResource("geolocation");

  /**
   * This class provides access to device GPS data.
   * @constructor
   */
  Geolocation = function() {
      // The last known GPS position.
      this.lastPosition = null;
      this.listener = null;
      this.timeoutTimerId = 0;

  };


  /**
   * Asynchronously aquires the current position.
   * @param {Function} successCallback The function to call when the position
   * data is available
   * @param {Function} errorCallback The function to call when there is an error 
   * getting the position data.
   * @param {PositionOptions} options The options for getting the position data
   * such as timeout.
   * PositionOptions.forcePrompt:Bool default false, 
   * - tells iPhone to prompt the user to turn on location services.
   * - may cause your app to exit while the user is sent to the Settings app
   * PositionOptions.distanceFilter:double aka Number
   * - used to represent a distance in meters.
  PositionOptions
  {
     desiredAccuracy:Number
     - a distance in meters 
  		< 10   = best accuracy  ( Default value )
  		< 100  = Nearest Ten Meters
  		< 1000 = Nearest Hundred Meters
  		< 3000 = Accuracy Kilometers
  		3000+  = Accuracy 3 Kilometers

  	forcePrompt:Boolean default false ( iPhone Only! )
      - tells iPhone to prompt the user to turn on location services.
  	- may cause your app to exit while the user is sent to the Settings app

  	distanceFilter:Number
  	- The minimum distance (measured in meters) a device must move laterally before an update event is generated.
  	- measured relative to the previously delivered location
  	- default value: null ( all movements will be reported )

  }

   */

  Geolocation.prototype.getCurrentPosition = function(successCallback, errorCallback, options) 
  {
      // create an always valid local success callback
      var win = successCallback;
      if (!win || typeof(win) != 'function')
      {
          win = function(position) {};
      }

      // create an always valid local error callback
      var fail = errorCallback;
      if (!fail || typeof(fail) != 'function')
      {
          fail = function(positionError) {};
      }	

      var self = this;
      var totalTime = 0;
  	var timeoutTimerId;

  	// set params to our default values
  	var params = new PositionOptions();

      if (options) 
      {
          if (options.maximumAge) 
          {
              // special case here if we have a cached value that is younger than maximumAge
              if(this.lastPosition)
              {
                  var now = new Date().getTime();
                  if((now - this.lastPosition.timestamp) < options.maximumAge)
                  {
                      win(this.lastPosition); // send cached position immediately 
                      return;                 // Note, execution stops here -jm
                  }
              }
              params.maximumAge = options.maximumAge;
          }
          if (options.enableHighAccuracy) 
          {
              params.enableHighAccuracy = (options.enableHighAccuracy == true); // make sure it's truthy
          }
          if (options.timeout) 
          {
              params.timeout = options.timeout;
          }
      }

      this.listener = {"success":win,"fail":fail};
      this.start(params);

  	var onTimeout = function()
  	{
  	    self.setError(new PositionError(PositionError.TIMEOUT,"Geolocation Error: Timeout."));
  	};

      clearTimeout(this.timeoutTimerId);
      this.timeoutTimerId = setTimeout(onTimeout, params.timeout); 
  };

  /**
   * Asynchronously aquires the position repeatedly at a given interval.
   * @param {Function} successCallback The function to call each time the position
   * data is available
   * @param {Function} errorCallback The function to call when there is an error 
   * getting the position data.
   * @param {PositionOptions} options The options for getting the position data
   * such as timeout and the frequency of the watch.
   */
  Geolocation.prototype.watchPosition = function(successCallback, errorCallback, options) {
  	// Invoke the appropriate callback with a new Position object every time the implementation 
  	// determines that the position of the hosting device has changed. 

  	var self = this; // those == this & that

  	var params = new PositionOptions();

      if(options)
      {
          if (options.maximumAge) {
              params.maximumAge = options.maximumAge;
          }
          if (options.enableHighAccuracy) {
              params.enableHighAccuracy = options.enableHighAccuracy;
          }
          if (options.timeout) {
              params.timeout = options.timeout;
          }
      }

  	var that = this;
      var lastPos = that.lastPosition? that.lastPosition.clone() : null;

  	var intervalFunction = function() {

  		var filterFun = function(position) {
              if (lastPos == null || !position.equals(lastPos)) {
                  // only call the success callback when there is a change in position, per W3C
                  successCallback(position);
              }

              // clone the new position, save it as our last position (internal var)
              lastPos = position.clone();
          };

  		that.getCurrentPosition(filterFun, errorCallback, params);
  	};

      // Retrieve location immediately and schedule next retrieval afterwards
  	intervalFunction();

  	return setInterval(intervalFunction, params.timeout);
  };


  /**
   * Clears the specified position watch.
   * @param {String} watchId The ID of the watch returned from #watchPosition.
   */
  Geolocation.prototype.clearWatch = function(watchId) {
  	clearInterval(watchId);
  };

  /**
   * Called by the geolocation framework when the current location is found.
   * @param {PositionOptions} position The current position.
   */
  Geolocation.prototype.setLocation = function(position) 
  {
      var _position = new Position(position.coords, position.timestamp);

      if(this.timeoutTimerId)
      {
          clearTimeout(this.timeoutTimerId);
          this.timeoutTimerId = 0;
      }

  	this.lastError = null;
      this.lastPosition = _position;

      if(this.listener && typeof(this.listener.success) == 'function')
      {
          this.listener.success(_position);
      }

      this.listener = null;
  };

  /**
   * Called by the geolocation framework when an error occurs while looking up the current position.
   * @param {String} message The text of the error message.
   */
  Geolocation.prototype.setError = function(error) 
  {
  	var _error = new PositionError(error.code, error.message);

      if(this.timeoutTimerId)
      {
          clearTimeout(this.timeoutTimerId);
          this.timeoutTimerId = 0;
      }

      this.lastError = _error;
      // call error handlers directly
      if(this.listener && typeof(this.listener.fail) == 'function')
      {
          this.listener.fail(_error);
      }
      this.listener = null;

  };

  Geolocation.prototype.start = function(positionOptions) 
  {
      PhoneGap.exec(null, null, "com.phonegap.geolocation", "startLocation", [positionOptions]);

  };

  Geolocation.prototype.stop = function() 
  {
      PhoneGap.exec(null, null, "com.phonegap.geolocation", "stopLocation", []);
  };


  PhoneGap.addConstructor(function() 
  {
      if (typeof navigator._geo == "undefined") 
      {
          // replace origObj's functions ( listed in funkList ) with the same method name on proxyObj
          // this is a workaround to prevent UIWebView/MobileSafari default implementation of GeoLocation
          // because it includes the full page path as the title of the alert prompt
          var __proxyObj = function (origObj,proxyObj,funkList)
          {
              var replaceFunk = function(org,proxy,fName)
              { 
                  org[fName] = function()
                  { 
                     return proxy[fName].apply(proxy,arguments); 
                  }; 
              };

              for(var v in funkList) { replaceFunk(origObj,proxyObj,funkList[v]);}
          }
          navigator._geo = new Geolocation();
          __proxyObj(navigator.geolocation, navigator._geo,
                   ["setLocation","getCurrentPosition","watchPosition",
                    "clearWatch","setError","start","stop"]);

      }

  });
  };
  if (!PhoneGap.hasResource("compass")) {
  	PhoneGap.addResource("compass");

  CompassError = function(){
     this.code = null;
  };

  // Capture error codes
  CompassError.COMPASS_INTERNAL_ERR = 0;
  CompassError.COMPASS_NOT_SUPPORTED = 20;

  CompassHeading = function() {
  	this.magneticHeading = null;
  	this.trueHeading = null;
  	this.headingAccuracy = null;
  	this.timestamp = null;
  }	
  /**
   * This class provides access to device Compass data.
   * @constructor
   */
  Compass = function() {
      /**
       * List of compass watch timers
       */
      this.timers = {};
  };

  /**
   * Asynchronously acquires the current heading.
   * @param {Function} successCallback The function to call when the heading
   * data is available
   * @param {Function} errorCallback The function to call when there is an error 
   * getting the heading data.
   * @param {PositionOptions} options The options for getting the heading data (not used).
   */
  Compass.prototype.getCurrentHeading = function(successCallback, errorCallback, options) {
   	// successCallback required
      if (typeof successCallback !== "function") {
          console.log("Compass Error: successCallback is not a function");
          return;
      }

      // errorCallback optional
      if (errorCallback && (typeof errorCallback !== "function")) {
          console.log("Compass Error: errorCallback is not a function");
          return;
      }

      // Get heading
      PhoneGap.exec(successCallback, errorCallback, "com.phonegap.geolocation", "getCurrentHeading", []);
  };

  /**
   * Asynchronously acquires the heading repeatedly at a given interval.
   * @param {Function} successCallback The function to call each time the heading
   * data is available
   * @param {Function} errorCallback The function to call when there is an error 
   * getting the heading data.
   * @param {HeadingOptions} options The options for getting the heading data
   * such as timeout and the frequency of the watch.
   */
  Compass.prototype.watchHeading= function(successCallback, errorCallback, options) 
  {
  	// Default interval (100 msec)
      var frequency = (options !== undefined) ? options.frequency : 100;

      // successCallback required
      if (typeof successCallback !== "function") {
          console.log("Compass Error: successCallback is not a function");
          return;
      }

      // errorCallback optional
      if (errorCallback && (typeof errorCallback !== "function")) {
          console.log("Compass Error: errorCallback is not a function");
          return;
      }

      // Start watch timer to get headings
      var id = PhoneGap.createUUID();
      navigator.compass.timers[id] = setInterval(
          function() {
              PhoneGap.exec(successCallback, errorCallback, "com.phonegap.geolocation", "getCurrentHeading", [{repeats: 1}]);
          }, frequency);

      return id;
  };


  /**
   * Clears the specified heading watch.
   * @param {String} watchId The ID of the watch returned from #watchHeading.
   */
  Compass.prototype.clearWatch = function(id) 
  {
  	// Stop javascript timer & remove from timer list
      if (id && navigator.compass.timers[id]) {
          clearInterval(navigator.compass.timers[id]);
          delete navigator.compass.timers[id];
      }
      if (navigator.compass.timers.length == 0) {
      	// stop the 
      	PhoneGap.exec(null, null, "com.phonegap.geolocation", "stopHeading", []);
      }
  };

  /** iOS only
   * Asynchronously fires when the heading changes from the last reading.  The amount of distance 
   * required to trigger the event is specified in the filter paramter.
   * @param {Function} successCallback The function to call each time the heading
   * data is available
   * @param {Function} errorCallback The function to call when there is an error 
   * getting the heading data.
   * @param {HeadingOptions} options The options for getting the heading data
   * 			@param {filter} number of degrees change to trigger a callback with heading data (float)
   *
   * In iOS this function is more efficient than calling watchHeading  with a frequency for updates.
   * Only one watchHeadingFilter can be in effect at one time.  If a watchHeadingFilter is in effect, calling
   * getCurrentHeading or watchHeading will use the existing filter value for specifying heading change. 
    */
  Compass.prototype.watchHeadingFilter = function(successCallback, errorCallback, options) 
  {

   	if (options === undefined || options.filter === undefined) {
   		console.log("Compass Error:  options.filter not specified");
   		return;
   	}

      // successCallback required
      if (typeof successCallback !== "function") {
          console.log("Compass Error: successCallback is not a function");
          return;
      }

      // errorCallback optional
      if (errorCallback && (typeof errorCallback !== "function")) {
          console.log("Compass Error: errorCallback is not a function");
          return;
      }
      PhoneGap.exec(successCallback, errorCallback, "com.phonegap.geolocation", "watchHeadingFilter", [options]);
  }
  Compass.prototype.clearWatchFilter = function() 
  {
      	PhoneGap.exec(null, null, "com.phonegap.geolocation", "stopHeading", []);
  };

  PhoneGap.addConstructor(function() 
  {
      if (typeof navigator.compass == "undefined") 
      {
          navigator.compass = new Compass();
      }
  });
  };

  if (!PhoneGap.hasResource("media")) {
  	PhoneGap.addResource("media");

  /*
   * PhoneGap is available under *either* the terms of the modified BSD license *or* the
   * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
   *
   * Copyright (c) 2005-2010, Nitobi Software Inc.
   * Copyright (c) 2010,2011 IBM Corporation
   */

  /**
   * List of media objects.
   * PRIVATE
   */
  PhoneGap.mediaObjects = {};

  /**
   * Object that receives native callbacks.
   * PRIVATE
   */
  PhoneGap.Media = function() {};


  /**
   * Get the media object.
   * PRIVATE
   *
   * @param id            The media object id (string)
   */
  PhoneGap.Media.getMediaObject = function(id) {
      return PhoneGap.mediaObjects[id];
  };

  /**
   * Audio has status update.
   * PRIVATE
   *
   * @param id            The media object id (string)
   * @param msg           The status message (int)
   * @param value        The status code (int)
   */
  PhoneGap.Media.onStatus = function(id, msg, value) {
      var media = PhoneGap.mediaObjects[id];

      // If state update
      if (msg == Media.MEDIA_STATE) {
          if (value == Media.MEDIA_STOPPED) {
              if (media.successCallback) {
                  media.successCallback();
              }
          }
          if (media.statusCallback) {
              media.statusCallback(value);
          }
      }
      else if (msg == Media.MEDIA_DURATION) {
          media._duration = value;
      }
      else if (msg == Media.MEDIA_ERROR) {
          if (media.errorCallback) {
              media.errorCallback(value);
          }
      }
      else if (msg == Media.MEDIA_POSITION) {
      	media._position = value;
      }
  };

  /**
   * This class provides access to the device media, interfaces to both sound and video
   *
   * @param src                   The file name or url to play
   * @param successCallback       The callback to be called when the file is done playing or recording.
   *                                  successCallback() - OPTIONAL
   * @param errorCallback         The callback to be called if there is an error.
   *                                  errorCallback(int errorCode) - OPTIONAL
   * @param statusCallback        The callback to be called when media status has changed.
   *                                  statusCallback(int statusCode) - OPTIONAL
   * @param positionCallback      The callback to be called when media position has changed.
   *                                  positionCallback(long position) - OPTIONAL
   */
  Media = function(src, successCallback, errorCallback, statusCallback, positionCallback) {

      // successCallback optional
      if (successCallback && (typeof successCallback != "function")) {
          console.log("Media Error: successCallback is not a function");
          return;
      }

      // errorCallback optional
      if (errorCallback && (typeof errorCallback != "function")) {
          console.log("Media Error: errorCallback is not a function");
          return;
      }

      // statusCallback optional
      if (statusCallback && (typeof statusCallback != "function")) {
          console.log("Media Error: statusCallback is not a function");
          return;
      }

      // positionCallback optional -- NOT SUPPORTED
      if (positionCallback && (typeof positionCallback != "function")) {
          console.log("Media Error: positionCallback is not a function");
          return;
      }

      this.id = PhoneGap.createUUID();
      PhoneGap.mediaObjects[this.id] = this;
      this.src = src;
      this.successCallback = successCallback;
      this.errorCallback = errorCallback;
      this.statusCallback = statusCallback;
      this.positionCallback = positionCallback;
      this._duration = -1;
      this._position = -1;
  };

  // Media messages
  Media.MEDIA_STATE = 1;
  Media.MEDIA_DURATION = 2;
  Media.MEDIA_POSITION = 3;
  Media.MEDIA_ERROR = 9;

  // Media states
  Media.MEDIA_NONE = 0;
  Media.MEDIA_STARTING = 1;
  Media.MEDIA_RUNNING = 2;
  Media.MEDIA_PAUSED = 3;
  Media.MEDIA_STOPPED = 4;
  Media.MEDIA_MSG = ["None", "Starting", "Running", "Paused", "Stopped"];

  // TODO: Will MediaError be used?
  /**
   * This class contains information about any Media errors.
   * @constructor
   */

  MediaError = function() {
  	this.code = null,
  	this.message = "";
  }


  MediaError.MEDIA_ERR_ABORTED        = 1;
  MediaError.MEDIA_ERR_NETWORK        = 2;
  MediaError.MEDIA_ERR_DECODE         = 3;
  MediaError.MEDIA_ERR_NONE_SUPPORTED = 4;

  /**
   * Start or resume playing audio file.
   */
  Media.prototype.play = function(options) {
      PhoneGap.exec(null, null, "com.phonegap.media", "play", [this.id, this.src, options]);
  };

  /**
   * Stop playing audio file.
   */
  Media.prototype.stop = function() {
      PhoneGap.exec(null, null, "com.phonegap.media","stop", [this.id, this.src]);
  };

  /**
   * Pause playing audio file.
   */
  Media.prototype.pause = function() {
      PhoneGap.exec(null, null, "com.phonegap.media","pause", [this.id, this.src]);
  };

  /**
   * Seek or jump to a new time in the track..
   */
  Media.prototype.seekTo = function(milliseconds) {
      PhoneGap.exec(null, null, "com.phonegap.media", "seekTo", [this.id, this.src, milliseconds]);
  };

  /**
   * Get duration of an audio file.
   * The duration is only set for audio that is playing, paused or stopped.
   *
   * @return      duration or -1 if not known.
   */
  Media.prototype.getDuration = function() {
      return this._duration;
  };

  /**
   * Get position of audio.
   *
   * @return
   */
  Media.prototype.getCurrentPosition = function(successCB, errorCB) {
  	var errCallback = (errorCB == undefined || errorCB == null) ? null : errorCB;
      PhoneGap.exec(successCB, errorCB, "com.phonegap.media", "getCurrentPosition", [this.id, this.src]);
  };

  // iOS only.  prepare/load the audio in preparation for playing
  Media.prototype.prepare = function(successCB, errorCB) {
  	PhoneGap.exec(successCB, errorCB, "com.phonegap.media", "prepare", [this.id, this.src]);
  }

  /**
   * Start recording audio file.
   */
  Media.prototype.startRecord = function() {
      PhoneGap.exec(null, null, "com.phonegap.media","startAudioRecord", [this.id, this.src]);
  };

  /**
   * Stop recording audio file.
   */
  Media.prototype.stopRecord = function() {
      PhoneGap.exec(null, null, "com.phonegap.media","stopAudioRecord", [this.id, this.src]);
  };

  /**
   * Release the resources.
   */
  Media.prototype.release = function() {
      PhoneGap.exec(null, null, "com.phonegap.media","release", [this.id, this.src]);
  };

  };
  if (!PhoneGap.hasResource("notification")) {
  	PhoneGap.addResource("notification");

  /**
   * This class provides access to notifications on the device.
   */
  Notification = function() {
  };

  /**
   * Open a native alert dialog, with a customizable title and button text.
   *
   * @param {String} message              Message to print in the body of the alert
   * @param {Function} completeCallback   The callback that is called when user clicks on a button.
   * @param {String} title                Title of the alert dialog (default: Alert)
   * @param {String} buttonLabel          Label of the close button (default: OK)
   */
  Notification.prototype.alert = function(message, completeCallback, title, buttonLabel) {
      var _title = title;
      if (title == null || typeof title === 'undefined') {
          _title = "Alert";
      }
      var _buttonLabel = (buttonLabel || "OK");
      PhoneGap.exec(completeCallback, null, "com.phonegap.notification", "alert", [message,{ "title": _title, "buttonLabel": _buttonLabel}]);
  };

  /**
   * Open a native confirm dialog, with a customizable title and button text.
   * The result that the user selects is returned to the result callback.
   *
   * @param {String} message              Message to print in the body of the alert
   * @param {Function} resultCallback     The callback that is called when user clicks on a button.
   * @param {String} title                Title of the alert dialog (default: Confirm)
   * @param {String} buttonLabels         Comma separated list of the labels of the buttons (default: 'OK,Cancel')
   */
  Notification.prototype.confirm = function(message, resultCallback, title, buttonLabels) {
      var _title = (title || "Confirm");
      var _buttonLabels = (buttonLabels || "OK,Cancel");
      this.alert(message, resultCallback, _title, _buttonLabels);
  };

  /**
   * Causes the device to blink a status LED.
   * @param {Integer} count The number of blinks.
   * @param {String} colour The colour of the light.
   */
  Notification.prototype.blink = function(count, colour) {
  // NOT IMPLEMENTED	
  };

  Notification.prototype.vibrate = function(mills) {
  	PhoneGap.exec(null, null, "com.phonegap.notification", "vibrate", []);
  };

  Notification.prototype.beep = function(count, volume) {
  	// No Volume yet for the iphone interface
  	// We can use a canned beep sound and call that
  	new Media('beep.wav').play();
  };

  PhoneGap.addConstructor(function() {
      if (typeof navigator.notification == "undefined") navigator.notification = new Notification();
  });
  };
  if (!PhoneGap.hasResource("orientation")) {
  	PhoneGap.addResource("orientation");

  /**
   * This class provides access to the device orientation.
   * @constructor
   */
  Orientation  = function() {
  	/**
  	 * The current orientation, or null if the orientation hasn't changed yet.
  	 */
  	this.currentOrientation = null;
  }

  /**
   * Set the current orientation of the phone.  This is called from the device automatically.
   * 
   * When the orientation is changed, the DOMEvent \c orientationChanged is dispatched against
   * the document element.  The event has the property \c orientation which can be used to retrieve
   * the device's current orientation, in addition to the \c Orientation.currentOrientation class property.
   *
   * @param {Number} orientation The orientation to be set
   */
  Orientation.prototype.setOrientation = function(orientation) {
      Orientation.currentOrientation = orientation;
      var e = document.createEvent('Events');
      e.initEvent('orientationChanged', 'false', 'false');
      e.orientation = orientation;
      document.dispatchEvent(e);
  };

  /**
   * Asynchronously aquires the current orientation.
   * @param {Function} successCallback The function to call when the orientation
   * is known.
   * @param {Function} errorCallback The function to call when there is an error 
   * getting the orientation.
   */
  Orientation.prototype.getCurrentOrientation = function(successCallback, errorCallback) {
  	// If the position is available then call success
  	// If the position is not available then call error
  };

  /**
   * Asynchronously aquires the orientation repeatedly at a given interval.
   * @param {Function} successCallback The function to call each time the orientation
   * data is available.
   * @param {Function} errorCallback The function to call when there is an error 
   * getting the orientation data.
   */
  Orientation.prototype.watchOrientation = function(successCallback, errorCallback) {
  	// Invoke the appropriate callback with a new Position object every time the implementation 
  	// determines that the position of the hosting device has changed. 
  	this.getCurrentPosition(successCallback, errorCallback);
  	return setInterval(function() {
  		navigator.orientation.getCurrentOrientation(successCallback, errorCallback);
  	}, 10000);
  };

  /**
   * Clears the specified orientation watch.
   * @param {String} watchId The ID of the watch returned from #watchOrientation.
   */
  Orientation.prototype.clearWatch = function(watchId) {
  	clearInterval(watchId);
  };

  Orientation.install = function()
  {
      if (typeof navigator.orientation == "undefined") { 
  		navigator.orientation = new Orientation();
  	}

  	var windowDispatchAvailable = !(window.dispatchEvent === undefined); // undefined in iOS 3.x
  	if (windowDispatchAvailable) {
  		return;
  	} 

  	// the code below is to capture window.add/remove eventListener calls on window
  	// this is for iOS 3.x where listening on 'orientationchange' events don't work on document/window (don't know why)
  	// however, window.onorientationchange DOES handle the 'orientationchange' event (sent through document), so...
  	// then we multiplex the window.onorientationchange event (consequently - people shouldn't overwrite this)

  	var self = this;
  	var orientationchangeEvent = 'orientationchange';
  	var newOrientationchangeEvent = 'orientationchange_pg';

  	// backup original `window.addEventListener`, `window.removeEventListener`
      var _addEventListener = window.addEventListener;
      var _removeEventListener = window.removeEventListener;

  	window.onorientationchange = function() {
  		PhoneGap.fireEvent(newOrientationchangeEvent, window);
  	}

      // override `window.addEventListener`
      window.addEventListener = function() {
          if (arguments[0] === orientationchangeEvent) {
  			arguments[0] = newOrientationchangeEvent; 
  		} 

  		if (!windowDispatchAvailable) {
  			return document.addEventListener.apply(this, arguments);
  		} else {
  			return _addEventListener.apply(this, arguments);
  		}
      };	

      // override `window.removeEventListener'
      window.removeEventListener = function() {
          if (arguments[0] === orientationchangeEvent) {
  			arguments[0] = newOrientationchangeEvent; 
  		} 

  		if (!windowDispatchAvailable) {
  			return document.removeEventListener.apply(this, arguments);
  		} else {
  			return _removeEventListener.apply(this, arguments);
  		}
      };	
  };

  PhoneGap.addConstructor(Orientation.install);

  };
  if (!PhoneGap.hasResource("sms")) {
  	PhoneGap.addResource("sms");

  /**
   * This class provides access to the device SMS functionality.
   * @constructor
   */
  Sms = function() {

  }

  /**
   * Sends an SMS message.
   * @param {Integer} number The phone number to send the message to.
   * @param {String} message The contents of the SMS message to send.
   * @param {Function} successCallback The function to call when the SMS message is sent.
   * @param {Function} errorCallback The function to call when there is an error sending the SMS message.
   * @param {PositionOptions} options The options for accessing the GPS location such as timeout and accuracy.
   */
  Sms.prototype.send = function(number, message, successCallback, errorCallback, options) {
  	// not sure why this is here when it does nothing????
  };

  PhoneGap.addConstructor(function() {
      if (typeof navigator.sms == "undefined") navigator.sms = new Sms();
  });
  };
  if (!PhoneGap.hasResource("telephony")) {
  	PhoneGap.addResource("telephony");

  /**
   * This class provides access to the telephony features of the device.
   * @constructor
   */
  Telephony = function() {

  }

  /**
   * Calls the specifed number.
   * @param {Integer} number The number to be called.
   */
  Telephony.prototype.call = function(number) {
  	// not sure why this is here when it does nothing????
  };

  PhoneGap.addConstructor(function() {
      if (typeof navigator.telephony == "undefined") navigator.telephony = new Telephony();
  });
  };if (!PhoneGap.hasResource("network")) {
  	PhoneGap.addResource("network");

  // //////////////////////////////////////////////////////////////////

  Connection = function() {
  	/*
  	 * One of the connection constants below.
  	 */
  	this.type = Connection.UNKNOWN;

  	/* initialize from the extended DeviceInfo properties */
      try {      
  		this.type	= DeviceInfo.connection.type;
      } 
  	catch(e) {
      }
  };

  Connection.UNKNOWN = "unknown"; // Unknown connection type
  Connection.ETHERNET = "ethernet";
  Connection.WIFI = "wifi";
  Connection.CELL_2G = "2g"; // the default for iOS, for any cellular connection
  Connection.CELL_3G = "3g";
  Connection.CELL_4G = "4g";
  Connection.NONE = "none"; // NO connectivity


  PhoneGap.addConstructor(function() {
      if (typeof navigator.network == "undefined") navigator.network = {};
      if (typeof navigator.network.connection == "undefined") navigator.network.connection = new Connection();
  });

  };if (!PhoneGap.hasResource("splashscreen")) {
  	PhoneGap.addResource("splashscreen");

  /**
   * This class provides access to the splashscreen
   */
  SplashScreen = function() {
  };

  SplashScreen.prototype.show = function() {
      PhoneGap.exec(null, null, "com.phonegap.splashscreen", "show", []);
  };

  SplashScreen.prototype.hide = function() {
      PhoneGap.exec(null, null, "com.phonegap.splashscreen", "hide", []);
  };

  PhoneGap.addConstructor(function() {
      if (typeof navigator.splashscreen == "undefined") navigator.splashscreen = new SplashScreen();
  });

  };
  
}