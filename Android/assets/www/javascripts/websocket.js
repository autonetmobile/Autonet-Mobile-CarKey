(function () {

  // Don't run this if we are in a browser that already supports websockets.
  var uagent = navigator.userAgent.toLowerCase();
  if (window.WebSocket && !uagent.match(/android/)) return;

	var global = window;
	
	var WebSocket = global.WebSocket = function (url) {
		// listener to overload
		this.onopen = null;
		this.onmessage = null;
		this.onerror = null;
		this.onclose = null;
		
		this._handler = WebSocketFactory.getNew(url);
		WebSocket.registry[this._handler.getIdentifier()] = this;
		
		this.readyState = WebSocket.CONNECTING;
	};
	
	WebSocket.registry = {};
	
	WebSocket.triggerEvent = function(evt) {
		WebSocket.__open
		if (WebSocket.registry[evt.target]['on' + evt.type]) {
		  WebSocket.registry[evt.target]['on' + evt.type].call(global, evt);
	  } else {
	    console.log("WARNING: WebSocket.registry[evt.target]['on' + evt.type] undefined for websocket: " + WebSocket.registry[evt.target] + " and event type: " + evt.type);
	  }
	}
	
	WebSocket.prototype.send = function(data) 
	{
		this._handler.send(decodeURIComponent(data));
	}
	
	WebSocket.prototype.close = function () 
	{
		this._handler.close();
	}	

})();