package com.spiderclock.widget;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.os.Build;
import android.os.SystemClock;
import android.util.TypedValue;
import android.widget.RemoteViews;

/**
 * Home-screen widget that SHOWS the spider clock immediately
 * (gears + spider + live hands) — no double-tap required to see it.
 */
public class SpiderClockWidget extends AppWidgetProvider {

    public static final String ACTION_TICK = "com.spiderclock.widget.ACTION_TICK";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int id : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, id);
        }
        scheduleTick(context);
    }

    @Override
    public void onEnabled(Context context) {
        scheduleTick(context);
    }

    @Override
    public void onDisabled(Context context) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am != null) am.cancel(tickPending(context));
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (intent != null && ACTION_TICK.equals(intent.getAction())) {
            AppWidgetManager mgr = AppWidgetManager.getInstance(context);
            int[] ids = mgr.getAppWidgetIds(new ComponentName(context, SpiderClockWidget.class));
            for (int id : ids) {
                updateAppWidget(context, mgr, id);
            }
            scheduleTick(context);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.spider_clock_widget);

        // Draw full clock face at ~widget size so it is visible without opening the app
        int sizePx = (int) TypedValue.applyDimension(
                TypedValue.COMPLEX_UNIT_DIP, 180,
                context.getResources().getDisplayMetrics()
        );
        try {
            int opts = appWidgetManager.getAppWidgetOptions(appWidgetId)
                    .getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_WIDTH, 0);
            if (opts > 0) {
                sizePx = (int) TypedValue.applyDimension(
                        TypedValue.COMPLEX_UNIT_DIP, Math.max(120, opts),
                        context.getResources().getDisplayMetrics()
                );
            }
        } catch (Exception ignored) {}
        sizePx = Math.min(512, Math.max(128, sizePx));

        Bitmap face = ClockBitmapRenderer.render(sizePx);
        views.setImageViewBitmap(R.id.widget_face, face);

        // Optional: still open full animated app on tap (single tap)
        Intent open = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (open == null) {
            open = new Intent(context, FloatingClockActivity.class);
        }
        open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi = PendingIntent.getActivity(
                context,
                appWidgetId,
                open,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_root, pi);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    private static PendingIntent tickPending(Context context) {
        Intent i = new Intent(context, SpiderClockWidget.class);
        i.setAction(ACTION_TICK);
        return PendingIntent.getBroadcast(
                context, 0, i,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    private static void scheduleTick(Context context) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        PendingIntent pi = tickPending(context);
        long trigger = SystemClock.elapsedRealtime() + 30_000L; // every 30s — hands stay accurate
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                am.setExactAndAllowWhileIdle(AlarmManager.ELAPSED_REALTIME_WAKEUP, trigger, pi);
            } else {
                am.setExact(AlarmManager.ELAPSED_REALTIME_WAKEUP, trigger, pi);
            }
        } catch (Exception e) {
            am.set(AlarmManager.ELAPSED_REALTIME_WAKEUP, trigger, pi);
        }
    }
}
