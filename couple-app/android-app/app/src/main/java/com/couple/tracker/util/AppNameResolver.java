package com.couple.tracker.util;

import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.util.LruCache;

/**
 * Resolves a package name (e.g. "com.tencent.mm") to a human-readable label ("微信").
 * Results are cached to avoid repeated PackageManager lookups.
 */
public class AppNameResolver {

    private final PackageManager pm;
    private final LruCache<String, String> cache = new LruCache<>(200);

    // Known package -> friendly name overrides (for packages that have unclear labels)
    private static final java.util.Map<String, String> KNOWN = new java.util.HashMap<>();
    static {
        KNOWN.put("com.tencent.mm",              "微信");
        KNOWN.put("com.sina.weibo",              "微博");
        KNOWN.put("com.xingin.xhs",              "小红书");
        KNOWN.put("com.ss.android.ugc.aweme",    "抖音");
        KNOWN.put("tv.danmaku.bili",             "哔哩哔哩");
        KNOWN.put("com.netease.cloudmusic",      "网易云音乐");
        KNOWN.put("com.tencent.qqmusic",         "QQ音乐");
        KNOWN.put("com.kugou.android",           "酷狗音乐");
        KNOWN.put("com.qiyi.video",              "爱奇艺");
        KNOWN.put("com.youku.phone",             "优酷");
        KNOWN.put("com.tencent.qqlite",          "QQ");
        KNOWN.put("com.tencent.mobileqq",        "QQ");
        KNOWN.put("com.alibaba.android.rimet",   "钉钉");
        KNOWN.put("com.ss.android.lark",         "飞书");
        KNOWN.put("com.taobao.taobao",           "淘宝");
        KNOWN.put("com.jingdong.app.mall",       "京东");
        KNOWN.put("com.pinduoduo.android",       "拼多多");
        KNOWN.put("com.wudaokou.lifup",          "美团");
        KNOWN.put("me.ele",                      "饿了么");
        KNOWN.put("com.eg.android.AlipayGphone", "支付宝");
        KNOWN.put("com.tencent.wetype",          "王者荣耀");  // 部分设备包名
        KNOWN.put("com.miHoYo.Yuanshen",         "原神");
        KNOWN.put("com.miHoYo.hkrpg",           "崩坏：星穹铁道");
        KNOWN.put("com.hypergryph.arknights",    "明日方舟");
        KNOWN.put("com.tencent.news",            "腾讯新闻");
        KNOWN.put("com.ss.android.article.news", "今日头条");
        KNOWN.put("com.hupu.games",              "虎扑");
        KNOWN.put("com.douban.frodo",            "豆瓣");
        KNOWN.put("com.zhihu.android",           "知乎");
        KNOWN.put("com.ximalaya.ting.android",   "喜马拉雅");
        KNOWN.put("com.tencent.weread",          "微信读书");
        KNOWN.put("cn.leancloud.im",             "猫箱");  // approximate
        KNOWN.put("com.google.android.youtube",  "YouTube");
        KNOWN.put("com.instagram.android",       "Instagram");
        KNOWN.put("com.twitter.android",         "Twitter/X");
        KNOWN.put("com.spotify.music",           "Spotify");
        KNOWN.put("com.netflix.mediaclient",     "Netflix");
    }

    public AppNameResolver(Context context) {
        this.pm = context.getPackageManager();
    }

    public String resolve(String packageName) {
        if (packageName == null) return "未知";

        // 1. Check hardcoded map
        if (KNOWN.containsKey(packageName)) return KNOWN.get(packageName);

        // 2. Check cache
        String cached = cache.get(packageName);
        if (cached != null) return cached;

        // 3. Ask PackageManager
        try {
            ApplicationInfo info = pm.getApplicationInfo(packageName, 0);
            String label = pm.getApplicationLabel(info).toString();
            cache.put(packageName, label);
            return label;
        } catch (PackageManager.NameNotFoundException e) {
            cache.put(packageName, packageName);
            return packageName;
        }
    }
}
