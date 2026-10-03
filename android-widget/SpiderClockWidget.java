package com.spiderclock.widget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;

/**
 * Home widget that displays the ORIGINAL spider clock (same SVG as the app)
 * by streaming live frames from ClockCaptureService — not a redrawn knockoff.
 */
public class SpiderClockWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        // Placeholder until first live frame arrives (same orange as app)
        for (int id : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.spider_clock_widget);
            Intent open = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
            if (open == null) {
                open = new Intent(context, FloatingClockActivity.class);
            }
            open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent pi = PendingIntent.getActivity(
                    context, id, open,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            views.setOnClickPendingIntent(R.id.widget_root, pi);
            appWidgetManager.updateAppWidget(id, views);
        }
        // Start capture of the real app clock
        ClockCaptureService.start(context);
    }

    @Override
    public void onEnabled(Context context) {
        ClockCaptureService.start(context);
    }

    @Override
    public void onDisabled(Context context) {
        ClockCaptureService.stop(context);
    }

    @Override
    public void onDeleted(Context context, int[] appWidgetIds) {
        // Service stops itself when no widgets remain
        ClockCaptureService.start(context);
    }
}
