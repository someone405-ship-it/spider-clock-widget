package com.spiderclock.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Real Android home-screen widget.
 * Stays on the launcher until the user removes it.
 * Tap opens the full animated Spider Clock app.
 */
class SpiderClockWidget : AppWidgetProvider() {
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (id in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, id)
        }
    }

    override fun onEnabled(context: Context) {
        // First widget added — stays until deleted
    }

    override fun onDisabled(context: Context) {
        // Last widget removed
    }

    companion object {
        fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val views = RemoteViews(context.packageName, R.layout.spider_clock_widget)
            val time = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date())
            val date = SimpleDateFormat("EEE d MMM", Locale.getDefault()).format(Date())
            views.setTextViewText(R.id.widget_time, time)
            views.setTextViewText(R.id.widget_date, date)
            views.setTextViewText(R.id.widget_title, "🕷️ Spider Clock")

            val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
            if (launch != null) {
                val pi = PendingIntent.getActivity(
                    context,
                    0,
                    launch,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                views.setOnClickPendingIntent(R.id.widget_root, pi)
            }

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
