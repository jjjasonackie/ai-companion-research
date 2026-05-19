package com.couple.tracker.api;

import android.util.Log;

import org.json.JSONObject;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

/**
 * Sends activity events to the couple-app server via HTTP REST.
 * Uses Bearer JWT for authentication — the token is stored in SharedPreferences
 * and never leaves the device except to your own server.
 */
public class ApiClient {

    private static final String TAG = "CoupleApiClient";
    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");

    private final OkHttpClient http;
    private final String baseUrl;
    private final String token;

    public ApiClient(String baseUrl, String token) {
        // Strip trailing slash
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        this.token = token;
        this.http = new OkHttpClient.Builder()
                .connectTimeout(10, TimeUnit.SECONDS)
                .readTimeout(10, TimeUnit.SECONDS)
                .writeTimeout(10, TimeUnit.SECONDS)
                .build();
    }

    /**
     * Notifies the server that the user has opened an app.
     * Called from the background service on every foreground app change.
     */
    public boolean reportActivityStart(String appName, String startTimeIso) {
        try {
            JSONObject body = new JSONObject();
            body.put("appName", appName);
            body.put("startTime", startTimeIso);

            return post("/api/activity/start", body.toString());
        } catch (Exception e) {
            Log.e(TAG, "reportActivityStart failed", e);
            return false;
        }
    }

    /**
     * Notifies the server that the user closed/switched away from an app.
     */
    public boolean reportActivityEnd(String endTimeIso) {
        try {
            JSONObject body = new JSONObject();
            body.put("endTime", endTimeIso);

            return post("/api/activity/end", body.toString());
        } catch (Exception e) {
            Log.e(TAG, "reportActivityEnd failed", e);
            return false;
        }
    }

    /**
     * Quick connectivity / token validity check — returns true if server responds 200.
     */
    public boolean ping() {
        try {
            Request req = new Request.Builder()
                    .url(baseUrl + "/api/state")
                    .header("Authorization", "Bearer " + token)
                    .get()
                    .build();
            try (Response resp = http.newCall(req).execute()) {
                return resp.isSuccessful();
            }
        } catch (IOException e) {
            return false;
        }
    }

    private boolean post(String path, String jsonBody) throws IOException {
        Request req = new Request.Builder()
                .url(baseUrl + path)
                .header("Authorization", "Bearer " + token)
                .post(RequestBody.create(jsonBody, JSON))
                .build();
        try (Response resp = http.newCall(req).execute()) {
            if (!resp.isSuccessful()) {
                Log.w(TAG, "POST " + path + " -> " + resp.code());
            }
            return resp.isSuccessful();
        }
    }
}
