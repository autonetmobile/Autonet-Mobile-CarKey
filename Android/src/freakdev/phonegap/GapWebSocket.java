package com.freakdev.phonegap;

import java.net.URISyntaxException;

import android.util.Log;
import android.webkit.WebView;

 public class GapWebSocket extends WebSocket{

	WebView mView;
	
	public GapWebSocket(WebView v, String url) throws URISyntaxException {
		super(url);
		mView = v;
	}
	
	protected static class JSEvent {
		static String buildJSON(String type, String target, String data) {
			Log.i("JSEvent", "{\"type\":\"" + type + "\",\"target\":\"" + target + "\",\"data\":'"+ data +"'}");
			return "{\"type\":\"" + type + "\",\"target\":\"" + target + "\",\"data\":'"+ data +"'}";
		}
		
		static String buildJSON(String type, String target) {
			return "{\"type\":\"" + type + "\",\"target\":\"" + target + "\",\"data\":\"\"}";
		}		
	}
	
	@Override
	protected void onmessage(String data) {
	  final String d = data;
	  final String sock = this.toString();
	  mView.post(new Runnable() {
      public void run() {
		    mView.loadUrl("javascript:WebSocket.triggerEvent(" + JSEvent.buildJSON("message", sock, d) + ")");
	    }
    });
	}

	@Override	
	protected void onopen() {
	  final String sock = this.toString();
	  mView.post(new Runnable() {
      public void run() {
        mView.loadUrl("javascript:WebSocket.triggerEvent(" + JSEvent.buildJSON("open", sock) + ")");
      }
    });
	}
	
	@Override	
	protected void onerror() {
	  final String sock = this.toString();
	  mView.post(new Runnable() {
      public void run() {
		    mView.loadUrl("javascript:WebSocket.triggerEvent(" + JSEvent.buildJSON("error", sock) + ")");
	    }
    });
	}

	@Override
	protected void onclose() {
	  final String sock = this.toString();
    if (mView != null) { // We may have never been initialized properly.
  	  mView.post(new Runnable() {
        public void run() {
  		    mView.loadUrl("javascript:WebSocket.triggerEvent(" + JSEvent.buildJSON("close", sock) + ")");
  	    }
      });
    }
	}
	
	public String getIdentifier() {
		return this.toString();
	}

	public int getReadyState() {
		return this.readyState;
	}	
	
}
