package com.AutonetMobile.CarKey;

import android.app.Activity;
import android.os.Bundle;
import com.phonegap.*;
import android.view.KeyEvent;
import com.freakdev.phonegap.*;
import android.view.View;
import android.view.MotionEvent;
import android.util.Log;
import android.webkit.WebSettings;


public class AutonetMobile extends DroidGap
{
    @Override
    public void onCreate(Bundle savedInstanceState)
    {
        super.onCreate(savedInstanceState);
        //super.setIntegerProperty("splashscreen", R.drawable.splash);
        super.loadUrl("file:///android_asset/www/index.html");
        WebSocketFactory wsFactory = new WebSocketFactory(appView);
        appView.addJavascriptInterface(wsFactory, "WebSocketFactory");
        // Workaround to try and help with clicking being ignored.
        // See: http://www.mail-archive.com/android-developers@googlegroups.com/msg22907.html
        super.appView.getSettings().setAppCacheEnabled(true);
        super.appView.getSettings().setAppCacheMaxSize(1024*1024*50);
        super.appView.getSettings().setAppCachePath(this.getCacheDir().getAbsolutePath());
        super.appView.getSettings().setCacheMode(WebSettings.LOAD_DEFAULT);
        appView.setOnTouchListener(new View.OnTouchListener() {
            public boolean onTouch(View v, MotionEvent event) {
                switch (event.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                    case MotionEvent.ACTION_UP:
                        if (!v.hasFocus()) {
                            v.requestFocus();
                        }
                        break;
                }
                return false;
            }
        });
    }
    
    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
      if (keyCode == KeyEvent.KEYCODE_BACK) {
        //file:///android_asset/www/app/views/keychain/index.html
        Log.v("AutonetMobile", "URL: " +  appView.getUrl());
        if (appView.getUrl().equals("file:///android_asset/www/app/views/keychain/index.html") ||
            appView.getUrl().equals("file:///android_asset/www/index.html") ||
            appView.getUrl().equals("file:///android_asset/www/app/views/login/login.html")) {
          this.finish();
          return true;
        }
        // appView.post(new Runnable() {
        //           public void run() {
        //             appView.loadUrl("javascript: try { AutonetApplication.backButtonWasPressed(); } catch(e) { history.go(-1); }");
        //           }
        //         });
        //         return true;
      }
      return super.onKeyDown(keyCode, event);
    }
}

