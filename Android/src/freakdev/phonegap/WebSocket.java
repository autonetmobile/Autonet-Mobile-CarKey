package com.freakdev.phonegap;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLEncoder;

import android.os.Handler;
import android.os.Message;
import android.util.Log;

/**
 * An implementation of a WebSocket protocol client. designed for being used in Android platform.
 * @author freakdev
 */
public class WebSocket extends com.sixfire.WebSocket {

    public final static int CONNECTING = 0; // The connection has not yet been established.
    public final static int OPEN = 1; // The WebSocket connection is established and communication is possible.
    public final static int CLOSING = 2; // The connection is going through the closing handshake.
    public final static int CLOSED = 3; // The connection has been closed or could not be opened.
    
    public int readyState = 0; // according to w3c specifications, should be "read-only"
    
    Thread connectThread = new Thread(new ConnectRunnable());
    
    protected Handler _messageHandler = new Handler() {
    	
    	@Override
    	public void handleMessage(Message msg) {
    	  String string = (String) msg.obj;
    	  Log.v("WebSocket", "Message: " + string);
    		onmessage(URLEncoder.encode(string).replace("+", "%20"));
    	}
    	
    };
	
    /**
     * as defined in the specification new object will automatically try to connect
     * @param url
     * @throws URISyntaxException
     */
	public WebSocket(String url) throws URISyntaxException {
		super(new URI(url));
		
		connectThread.start();
	}
	
	
	// event methods
	// these methods are called when an event is raised you should overrides their behavior to match your need
	
	protected void onopen() {
	}
	
	protected void onmessage(String data) {
	}
	
	protected void onerror() {
	}
	
	protected void onclose() {
	}
	
	
	@Override
	public void close()
	{
		//if (WebSocket.CLOSING == this.readyState || WebSocket.CLOSED == this.readyState) {
		try {
			this.readyState = WebSocket.CLOSING;
			super.close();
			Log.v("Websocket", "[close] " + "waiting for connectThread thread to exit.");
			connectThread.interrupt(); // My attempt to wait for things to shut down before proceeding.
			this.readyState = WebSocket.CLOSED;
			this.onclose();
		} catch (Exception e) { // IOException or  InterruptedException
		  Log.v("WebSocket", "[close]" + e.getMessage());
		  e.printStackTrace();
		}
		//}
	}
	
	@Override
	public void send(String data)
	{
		if (WebSocket.OPEN == this.readyState) {
		  Log.w("WebSocket", "[send] sending: " + data);
			try {
				super.send(data);
			} catch (Exception e) {
				Log.w("WebSocket", "[send] " + e.getMessage());
				e.printStackTrace();
				this.onerror();
			}
		} else {
		  Log.w("WebSocket", "[send] " + "not sending data. connection is not open.");
			// throw invalid state exception
			this.onerror();
//			throw new IllegalStateException("Socket is not open. can't send.");
		}
	}

	
	protected void WaitForDataLoop () {
		
		Log.i("Thread Info", Thread.currentThread().getName()); 
		try {
			Log.i("WebSocket", "waiting for data");
			while (WebSocket.CLOSING > readyState) {
		    Log.v("WebSocket", "Reading.");
			  String response = recv();
			  _messageHandler.sendMessage(_messageHandler.obtainMessage(1, response));
			  Thread.currentThread().sleep(200);
			}
		} catch (Exception e) {
			if (WebSocket.CLOSING > readyState) {
				Log.w("WebSocket", "[WaitForDataLoop] " + e.getMessage());
				e.printStackTrace();
				onerror();
			} else {
			  Log.w("WebSocket", "[WaitForDataLoop] " + e.getMessage());
			  Log.w("WebSocket", "[WaitForDataLoop] Closing");
			  onclose();
			}
		}
		
	}		
	
	private class ConnectRunnable implements Runnable {

		@Override
		public void run() {
			Log.i("Thread Info", Thread.currentThread().getName());
			try {
				if (WebSocket.OPEN != readyState) {
					readyState = WebSocket.CONNECTING; 
					Log.i("Thread Info", "status connecting");
					connect();
					readyState = WebSocket.OPEN;
					Log.i("Thread Info", "status connected");
					onopen();
					Log.i("Thread Info", "status onopen called");
					
					WaitForDataLoop();
				}
				
			} catch (Exception e) {
				Log.w("WebSocket", "[Connect.run] " + e.getMessage());
				e.printStackTrace();
				
				try {
					close();
				} catch (Exception e1) {
					Log.w("WebSocket", "[Connect.run | connection fallback] " + e1.getMessage());
					e1.printStackTrace();
					onclose();
				}
			}
			
		}
		
	}

}
