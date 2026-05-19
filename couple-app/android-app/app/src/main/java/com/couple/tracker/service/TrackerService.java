package com.couple.tracker.service;

import android.app.AppOpsManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.app.usage.UsageEvents;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import com.couple.tracker.R;
import com.couple.tracker.api.ApiClient;
import com.couple.tracker.ui.SetupActivity;
import com.couple.tracker.util.AppNameResolver;
import com.couple.tracker.util.Prefs;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Foreground service that polls UsageStatsManager every 3 seconds.
 * When the foreground app changes, it calls the server's REST API to
 * report the start of the new app (and implicitly end the previous one).
 *
 * Why polling?  Android doesn't expose a broadcast for foreground app changes
 * to third-party apps. UsageStatsManager + polling is the standard approach
 * used by parental-control and productivity apps.
 *
 * Privacy guarantee: Only the app label is sent to your own server.
 * No screen content, no keystrokes, no location — ever.
 */
public class TrackerService extends Service {

    public static final String ACTION_STOP = "com.couple.tracker.STOP";
    private static final String TAG = "CoupleTracker";
    private static final String NOTIF_CHANNEL = "tracker_channel";
    private static final int NOTIF_ID = 1;
    private static final long POLL_INTERVAL_MS = 3_000;    // check every 3s
    // Ignore system/launcher packages that shouldn't appear in the timeline
    private static final java.util.Set<String> IGNORE_PACKAGES = new java.util.HashSet<>(
            java.util.Arrays.asList(
                    "android", "com.android.systemui", "com.android.launcher",
                    "com.android.launcher3", "com.miui.home", "com.huawei.android.launcher",
                    "com.samsung.android.app.launcher", "com.oppo.launcher", "net.oneplus.launcher",
                    "com.vivo.launcher", "com.iqoo.secure", "com.android.settings",
                    "com.couple.tracker"  // ourselves
            )
    );

    private final Handler handler = new Handler(Looper.getMainLooper());
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final SimpleDateFormat iso8601 = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);

    private UsageStatsManager usageStatsManager;
    private AppNameResolver nameResolver;
    private ApiClient apiClient;
    private Prefs prefs;

    private String lastForegroundPackage = "";
    private long lastForegroundTime = 0;

    @Override
    public void onCreate() {
        super.onCreate();
        iso8601.setTimeZone(TimeZone.getTimeZone("UTC"));

        prefs = new Prefs(this);
        usageStatsManager = (UsageStatsManager) getSystemService(Context.USAGE_STATS_SERVICE);
        nameResolver = new AppNameResolver(this);
        apiClient = new ApiClient(prefs.getServerUrl(), prefs.getToken());

        createNotificationChannel();
        startForeground(NOTIF_ID, buildNotification("监听中...", null));
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            stopSelf();
            return START_NOT_STICKY;
        }
        // Rebuild ApiClient with latest config (in case token was updated)
        apiClient = new ApiClient(prefs.getServerUrl(), prefs.getToken());
        handler.post(pollRunnable);
        return START_STICKY;  // Restart if killed
    }

    private final Runnable pollRunnable = new Runnable() {
        @Override
        public void run() {
            if (!prefs.isTrackingEnabled()) {
                handler.postDelayed(this, POLL_INTERVAL_MS);
                return;
            }
            checkForegroundApp();
            handler.postDelayed(this, POLL_INTERVAL_MS);
        }
    };

    private void checkForegroundApp() {
        if (!hasUsagePermission()) {
            Log.w(TAG, "Usage stats permission not granted");
            return;
        }

        long now = System.currentTimeMillis();
        UsageEvents events = usageStatsManager.queryEvents(now - 10_000, now);  // last 10s
        UsageEvents.Event event = new UsageEvents.Event();

        String latestPackage = null;
        long latestTime = 0;

        while (events.hasNextEvent()) {
            events.getNextEvent(event);
            if (event.getEventType() == UsageEvents.Event.MOVE_TO_FOREGROUND) {
                if (event.getTimeStamp() > latestTime) {
                    latestTime = event.getTimeStamp();
                    latestPackage = event.getPackageName();
                }
            }
        }

        if (latestPackage == null || IGNORE_PACKAGES.contains(latestPackage)) return;
        if (latestPackage.equals(lastForegroundPackage)) return;  // no change

        // App changed
        final String newPkg = latestPackage;
        final long newTime  = latestTime > 0 ? latestTime : now;
        lastForegroundPackage = newPkg;
        lastForegroundTime    = newTime;

        executor.execute(() -> {
            String appName = nameResolver.resolve(newPkg);
            String timeIso = iso8601.format(new Date(newTime));
            Log.d(TAG, "Foreground -> " + appName + " (" + newPkg + ")");

            boolean ok = apiClient.reportActivityStart(appName, timeIso);
            if (!ok) Log.w(TAG, "Failed to report to server");

            // Update notification text
            updateNotification("正在用：" + appName, newPkg);
        });
    }

    private boolean hasUsagePermission() {
        AppOpsManager aom = (AppOpsManager) getSystemService(Context.APP_OPS_SERVICE);
        int mode = aom.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                android.os.Process.myUid(),
                getPackageName()
        );
        return mode == AppOpsManager.MODE_ALLOWED;
    }

    private void updateNotification(String text, String pkg) {
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        nm.notify(NOTIF_ID, buildNotification(text, pkg));
    }

    private Notification buildNotification(String contentText, String pkg) {
        Intent stopIntent = new Intent(this, TrackerService.class);
        stopIntent.setAction(ACTION_STOP);
        PendingIntent stopPi = PendingIntent.getService(this, 0, stopIntent,
                PendingIntent.FLAG_IMMUTABLE);

        Intent openIntent = new Intent(this, SetupActivity.class);
        PendingIntent openPi = PendingIntent.getActivity(this, 0, openIntent,
                PendingIntent.FLAG_IMMUTABLE);

        return new NotificationCompat.Builder(this, NOTIF_CHANNEL)
                .setSmallIcon(R.drawable.ic_heart)
                .setContentTitle("💕 与 TA 同在")
                .setContentText(contentText)
                .setContentIntent(openPi)
                .addAction(0, "停止", stopPi)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .build();
    }

    private void createNotificationChannel() {
        NotificationChannel channel = new NotificationChannel(
                NOTIF_CHANNEL,
                "应用追踪",
                NotificationManager.IMPORTANCE_LOW
        );
        channel.setDescription("在后台记录正在使用的应用");
        ((NotificationManager) getSystemService(NOTIFICATION_SERVICE))
                .createNotificationChannel(channel);
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        handler.removeCallbacks(pollRunnable);
        executor.shutdown();
        // Tell server this session ended
        new Thread(() -> {
            if (apiClient != null) {
                apiClient.reportActivityEnd(iso8601.format(new Date()));
            }
        }).start();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) { return null; }
}
