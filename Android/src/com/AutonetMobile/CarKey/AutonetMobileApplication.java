package com.AutonetMobile.CarKey;

import android.app.Application;
import org.acra.*;
import org.acra.annotation.*;

@ReportsCrashes(formKey = "dGs3SktienJ6ZlliWDlqbWc5eXpsbUE6MQ")

public class AutonetMobileApplication extends Application
{
    @Override
    public void onCreate()
    {
        ACRA.init(this); 
        super.onCreate();
    }
}
