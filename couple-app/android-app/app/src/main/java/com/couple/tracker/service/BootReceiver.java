package com.couple.tracker.service;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import com.couple.tracker.util.Prefs;

/**
 * Starts TrackerService automatically when the device boots.
 * Only starts if the user has previously configured the app.
 */
public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (!Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) return;

        Prefs prefs = new Prefs(context);
        if (prefs.isConfigured() && prefs.isTrackingEnabled()) {
            Intent service = new Intent(context, TrackerService.class);
            context.startForegroundService(service);
        }
    }
}
