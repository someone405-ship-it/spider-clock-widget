package com.spiderclock.widget;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;
import android.view.View;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.RemoteViews;

/**
 * Hidden WebView runs the SAME index.html as the app (original SVG spider + gears)
 * and pushes live frames to the home-screen widget.
 */
public class ClockCaptureService extends Service {

    private static final String TAG = "ClockCapture";
    private static final String CHANNEL_ID = "spider_clock_widget";
    private static final int NOTIF_ID = 42;
    private static final int CAPTURE_SIZE = 400;
    // 2 fps — catches original 1s gear bounce ticks without heavy battery use
    private static final long FRAME_MS = 500L;

    private WebView webView;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private boolean pageReady = false;
    private boolean running = false;

    private final Runnable frameLoop = new Runnable() {
        @Override
        public void run() {
            if (!running) return;
            captureAndPush();
            handler.postDelayed(this, FRAME_MS);
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        startForeground(NOTIF_ID, buildNotification());
        setupWebView();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        running = true;
        handler.removeCallbacks(frameLoop);
        handler.postDelayed(frameLoop, 600);
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        running = false;
        handler.removeCallbacks(frameLoop);
        if (webView != null) {
            try {
                webView.loadUrl("about:blank");
                webView.stopLoading();
                webView.destroy();
            } catch (Exception ignored) {}
            webView = null;
        }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private Notification buildNotification() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(
                    CHANNEL_ID,
                    "Spider Clock Widget",
                    NotificationManager.IMPORTANCE_MIN
            );
            ch.setDescription("Live original spider clock on home screen");
            ch.setShowBadge(false);
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) nm.createNotificationChannel(ch);
        }
        Intent open = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent pi = open != null
                ? PendingIntent.getActivity(this, 0, open,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE)
                : null;

        Notification.Builder b = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? new Notification.Builder(this, CHANNEL_ID)
                : new Notification.Builder(this);
        b.setContentTitle("Spider Clock")
                .setContentText("Original clock on home screen")
                .setSmallIcon(android.R.drawable.ic_menu_recent_history)
                .setOngoing(true);
        if (pi != null) b.setContentIntent(pi);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            b.setForegroundServiceBehavior(Notification.FOREGROUND_SERVICE_IMMEDIATE);
        }
        return b.build();
    }

    @SuppressWarnings("SetJavaScriptEnabled")
    private void setupWebView() {
        webView = new WebView(getApplicationContext());
        webView.setBackgroundColor(Color.parseColor("#a34a01"));
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);

        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                pageReady = true;
                view.evaluateJavascript(
                        "(function(){try{" +
                                "document.body.classList.remove('widget-mode','settings-open','edit-mode');" +
                                "document.body.style.margin='0';document.body.style.overflow='hidden';" +
                                "var w=document.querySelector('.gsapWrapper');" +
                                "if(w){w.style.visibility='visible';w.style.opacity='1';" +
                                "w.style.position='static';w.style.left='';w.style.top='';}" +
                                "['.settings-btn','.edit-mode-btn','.settings-overlay','.digital-time','.sc-toast','.vline','.drag-bar']" +
                                ".forEach(function(sel){var e=document.querySelector(sel);if(e)e.style.display='none';});" +
                                "var b=document.getElementById('wBody');" +
                                "if(b){b.style.width='100%';b.style.maxWidth='100%';}" +
                                "}catch(e){}})();",
                        null
                );
            }
        });

        webView.loadUrl("file:///android_asset/public/index.html");

        int w = CAPTURE_SIZE;
        int h = CAPTURE_SIZE;
        webView.measure(
                View.MeasureSpec.makeMeasureSpec(w, View.MeasureSpec.EXACTLY),
                View.MeasureSpec.makeMeasureSpec(h, View.MeasureSpec.EXACTLY)
        );
        webView.layout(0, 0, w, h);
    }

    private void captureAndPush() {
        if (webView == null || !pageReady) return;
        try {
            int w = CAPTURE_SIZE;
            int h = CAPTURE_SIZE;
            webView.measure(
                    View.MeasureSpec.makeMeasureSpec(w, View.MeasureSpec.EXACTLY),
                    View.MeasureSpec.makeMeasureSpec(h, View.MeasureSpec.EXACTLY)
            );
            webView.layout(0, 0, w, h);

            Bitmap bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
            Canvas canvas = new Canvas(bmp);
            canvas.drawColor(Color.parseColor("#a34a01"));
            webView.draw(canvas);
            pushToWidgets(bmp);
        } catch (Exception e) {
            Log.w(TAG, "capture failed", e);
        }
    }

    private void pushToWidgets(Bitmap bmp) {
        AppWidgetManager mgr = AppWidgetManager.getInstance(this);
        ComponentName cn = new ComponentName(this, SpiderClockWidget.class);
        int[] ids = mgr.getAppWidgetIds(cn);
        if (ids == null || ids.length == 0) {
            stopSelf();
            return;
        }
        for (int id : ids) {
            RemoteViews views = new RemoteViews(getPackageName(), R.layout.spider_clock_widget);
            views.setImageViewBitmap(R.id.widget_face, bmp);
            Intent open = getPackageManager().getLaunchIntentForPackage(getPackageName());
            if (open == null) open = new Intent(this, FloatingClockActivity.class);
            open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent pi = PendingIntent.getActivity(
                    this, id, open,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            views.setOnClickPendingIntent(R.id.widget_root, pi);
            mgr.updateAppWidget(id, views);
        }
    }

    public static void start(Context context) {
        Intent i = new Intent(context, ClockCaptureService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(i);
        } else {
            context.startService(i);
        }
    }

    public static void stop(Context context) {
        context.stopService(new Intent(context, ClockCaptureService.class));
    }
}
