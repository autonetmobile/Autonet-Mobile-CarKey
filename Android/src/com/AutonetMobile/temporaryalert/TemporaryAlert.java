package com.twotoasters.temporaryalert;

import org.json.JSONArray;
import org.json.JSONException;
import com.phonegap.api.Plugin;
import com.phonegap.api.PhonegapActivity;
import com.phonegap.api.PluginResult;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.os.Message;
import android.os.Handler;
import android.util.Log;

public class TemporaryAlert extends Plugin
{
  @Override
  public PluginResult execute(String action, JSONArray args, String callbackId) {
    Log.v("TemporaryAlert", "Executing: " + action);
    PluginResult.Status status = PluginResult.Status.OK;
    String result = "";
    try {
      if(action.equals("show")) {
        final TemporaryAlert alert = this;
        final String string = args.getString(0);
        webView.post(new Runnable() {
          public void run() {
            alert.temporaryAlert(string);
          }
        });
      } else if (action.equals("exit")) { // TODO: this should go into it's own plugin.
        ctx.finish();
        // int pid = android.os.Process.myPid(); 
        // android.os.Process.killProcess(pid);
      }
      return new PluginResult(status, result);
    } catch (Exception e) {
      Log.v("TemporaryAlert", "EXCEPTION: " + e);
      e.printStackTrace();
      return new PluginResult(PluginResult.Status.JSON_EXCEPTION);
    }
  }
  
  public synchronized void temporaryAlert(final String message) {
    final PhonegapActivity ctx = this.ctx;
    AlertDialog alertDialog = new AlertDialog.Builder(ctx).create();  
    alertDialog.setTitle("Alert");  
    alertDialog.setMessage(message);  
    alertDialog.setButton("OK", new DialogInterface.OnClickListener() {  
      public void onClick(DialogInterface dialog, int which) {  
        return;  
    } });
    
    class DismissAlertHandler extends Handler {
        @Override
        public void handleMessage(Message msg) {
          AlertDialog alert = (AlertDialog) msg.obj;
          alert.dismiss();
        }
    }
    Handler myHandler = new DismissAlertHandler();
    Message m = new Message();
    m.obj = alertDialog;
    myHandler.sendMessageDelayed(m, 5000);
    alertDialog.show();
  } 
}