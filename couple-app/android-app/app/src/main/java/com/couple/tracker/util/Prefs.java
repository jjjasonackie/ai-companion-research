package com.couple.tracker.util;

import android.content.Context;
import android.content.SharedPreferences;

/**
 * Thin wrapper around SharedPreferences for storing configuration.
 * All sensitive data (token) is stored in private mode —
 * inaccessible to other apps on non-rooted devices.
 */
public class Prefs {

    private static final String FILE   = "couple_tracker_prefs";
    private static final String K_URL  = "server_url";
    private static final String K_TOK  = "jwt_token";
    private static final String K_ENABLED = "tracking_enabled";

    private final SharedPreferences sp;

    public Prefs(Context ctx) {
        sp = ctx.getApplicationContext()
                .getSharedPreferences(FILE, Context.MODE_PRIVATE);
    }

    public void saveConfig(String serverUrl, String token) {
        sp.edit().putString(K_URL, serverUrl).putString(K_TOK, token).apply();
    }

    public String getServerUrl()  { return sp.getString(K_URL, ""); }
    public String getToken()      { return sp.getString(K_TOK, ""); }

    public boolean isConfigured() {
        return !getServerUrl().isEmpty() && !getToken().isEmpty();
    }

    public boolean isTrackingEnabled() { return sp.getBoolean(K_ENABLED, true); }
    public void setTrackingEnabled(boolean v) { sp.edit().putBoolean(K_ENABLED, v).apply(); }

    public void clear() { sp.edit().clear().apply(); }
}
