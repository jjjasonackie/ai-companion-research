package com.couple.tracker.ui;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.provider.Settings;
import android.text.TextUtils;
import android.view.View;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.couple.tracker.R;
import com.couple.tracker.api.ApiClient;
import com.couple.tracker.databinding.ActivitySetupBinding;
import com.couple.tracker.service.TrackerService;
import com.couple.tracker.util.Prefs;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * One-time setup screen.
 *
 * The user pastes:
 *  1. Server URL  — e.g.  http://192.168.1.100:3001  or  https://love.example.com
 *  2. Their JWT token — copied from the web app (Settings > 查看我的 Token)
 *
 * After saving, this screen doubles as a status dashboard showing
 * whether tracking is active and the current permission state.
 */
public class SetupActivity extends AppCompatActivity {

    private ActivitySetupBinding b;
    private Prefs prefs;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        b = ActivitySetupBinding.inflate(getLayoutInflater());
        setContentView(b.getRoot());

        prefs = new Prefs(this);

        // Pre-fill if already configured
        b.etServerUrl.setText(prefs.getServerUrl());
        b.etToken.setText(prefs.getToken());

        b.btnSave.setOnClickListener(v -> saveAndStart());
        b.btnPermission.setOnClickListener(v -> openUsageSettings());
        b.btnStop.setOnClickListener(v -> stopTracking());

        updateUi();
    }

    @Override
    protected void onResume() {
        super.onResume();
        updateUi();
    }

    private void saveAndStart() {
        String url   = b.etServerUrl.getText().toString().trim();
        String token = b.etToken.getText().toString().trim();

        if (TextUtils.isEmpty(url) || TextUtils.isEmpty(token)) {
            toast("请填写服务器地址和 Token");
            return;
        }

        b.btnSave.setEnabled(false);
        b.tvStatus.setText("验证中...");

        executor.execute(() -> {
            ApiClient client = new ApiClient(url, token);
            boolean ok = client.ping();
            runOnUiThread(() -> {
                b.btnSave.setEnabled(true);
                if (ok) {
                    prefs.saveConfig(url, token);
                    startTracking();
                    updateUi();
                    toast("连接成功 ✓");
                } else {
                    b.tvStatus.setText("连接失败，请检查地址和 Token");
                    toast("无法连接服务器");
                }
            });
        });
    }

    private void startTracking() {
        Intent i = new Intent(this, TrackerService.class);
        startForegroundService(i);
    }

    private void stopTracking() {
        Intent i = new Intent(this, TrackerService.class);
        i.setAction(TrackerService.ACTION_STOP);
        startService(i);
        updateUi();
    }

    /** Opens the system Usage Access settings page. */
    private void openUsageSettings() {
        startActivity(new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS));
    }

    private void updateUi() {
        boolean configured   = prefs.isConfigured();
        boolean hasPermission = hasUsagePermission();
        boolean tracking     = isServiceRunning();

        // Permission step
        if (hasPermission) {
            b.cardPermission.setCardBackgroundColor(getColor(R.color.step_done));
            b.tvPermissionStatus.setText("✓ 使用情况访问权限已授权");
            b.btnPermission.setVisibility(View.GONE);
        } else {
            b.cardPermission.setCardBackgroundColor(getColor(R.color.step_pending));
            b.tvPermissionStatus.setText("需要授权「使用情况访问」权限");
            b.btnPermission.setVisibility(View.VISIBLE);
        }

        // Tracking status
        if (tracking) {
            b.tvStatus.setText("💚 正在运行 — 自动同步中");
            b.btnSave.setText("更新配置");
            b.btnStop.setVisibility(View.VISIBLE);
        } else {
            b.tvStatus.setText(configured ? "已配置，点击保存以启动" : "请填写配置信息");
            b.btnStop.setVisibility(View.GONE);
        }
    }

    private boolean hasUsagePermission() {
        android.app.AppOpsManager aom = (android.app.AppOpsManager) getSystemService(APP_OPS_SERVICE);
        int mode = aom.checkOpNoThrow(
                android.app.AppOpsManager.OPSTR_GET_USAGE_STATS,
                android.os.Process.myUid(),
                getPackageName()
        );
        return mode == android.app.AppOpsManager.MODE_ALLOWED;
    }

    private boolean isServiceRunning() {
        android.app.ActivityManager am = (android.app.ActivityManager) getSystemService(ACTIVITY_SERVICE);
        for (android.app.ActivityManager.RunningServiceInfo svc : am.getRunningServices(50)) {
            if (TrackerService.class.getName().equals(svc.service.getClassName())) return true;
        }
        return false;
    }

    private void toast(String msg) {
        Toast.makeText(this, msg, Toast.LENGTH_SHORT).show();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        executor.shutdown();
    }
}
