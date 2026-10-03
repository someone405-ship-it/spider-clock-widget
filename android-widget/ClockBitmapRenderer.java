package com.spiderclock.widget;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RadialGradient;
import android.graphics.RectF;
import android.graphics.Shader;

import java.util.Calendar;

/**
 * Draws the spider clock (gears + spider + hands) onto a bitmap
 * so the home-screen widget shows the clock without opening the app.
 */
public final class ClockBitmapRenderer {

    private ClockBitmapRenderer() {}

    public static Bitmap render(int sizePx) {
        if (sizePx < 64) sizePx = 64;
        Bitmap bmp = Bitmap.createBitmap(sizePx, sizePx, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(bmp);
        float cx = sizePx / 2f;
        float cy = sizePx / 2f;
        float r = sizePx / 2f - 2f;

        // Background gradient (matches app #a34a01 → #654201)
        Paint bg = new Paint(Paint.ANTI_ALIAS_FLAG);
        bg.setShader(new LinearGradient(
                0, 0, sizePx, sizePx,
                0xFFA34A01, 0xFF654201,
                Shader.TileMode.CLAMP
        ));
        c.drawCircle(cx, cy, r, bg);

        // Soft inner vignette
        Paint vig = new Paint(Paint.ANTI_ALIAS_FLAG);
        vig.setShader(new RadialGradient(
                cx, cy, r,
                new int[]{0x00000000, 0x33000000},
                new float[]{0.55f, 1f},
                Shader.TileMode.CLAMP
        ));
        c.drawCircle(cx, cy, r, vig);

        // Outer ring
        Paint ring = new Paint(Paint.ANTI_ALIAS_FLAG);
        ring.setStyle(Paint.Style.STROKE);
        ring.setStrokeWidth(Math.max(2f, sizePx * 0.02f));
        ring.setColor(0xFFFFCC80);
        c.drawCircle(cx, cy, r * 0.92f, ring);

        // Gear teeth around the dial
        drawGears(c, cx, cy, r, sizePx);

        // Tick marks
        Paint tick = new Paint(Paint.ANTI_ALIAS_FLAG);
        tick.setColor(0xCCFFFFFF);
        tick.setStrokeWidth(Math.max(1.5f, sizePx * 0.012f));
        tick.setStrokeCap(Paint.Cap.ROUND);
        for (int i = 0; i < 12; i++) {
            double a = Math.toRadians(i * 30 - 90);
            float r1 = r * 0.78f;
            float r2 = r * (i % 3 == 0 ? 0.68f : 0.72f);
            c.drawLine(
                    cx + (float) Math.cos(a) * r1,
                    cy + (float) Math.sin(a) * r1,
                    cx + (float) Math.cos(a) * r2,
                    cy + (float) Math.sin(a) * r2,
                    tick
            );
        }

        // Time hands
        Calendar cal = Calendar.getInstance();
        float sec = cal.get(Calendar.SECOND) + cal.get(Calendar.MILLISECOND) / 1000f;
        float min = cal.get(Calendar.MINUTE) + sec / 60f;
        float hour = (cal.get(Calendar.HOUR_OF_DAY) % 12) + min / 60f;

        float secA = (sec / 60f) * 360f - 90f;
        float minA = (min / 60f) * 360f - 90f;
        float hrA = (hour / 12f) * 360f - 90f;

        Paint hand = new Paint(Paint.ANTI_ALIAS_FLAG);
        hand.setStrokeCap(Paint.Cap.ROUND);
        hand.setStyle(Paint.Style.STROKE);

        // Hour
        hand.setColor(0xFFFFFFFF);
        hand.setStrokeWidth(Math.max(3f, sizePx * 0.035f));
        drawHand(c, cx, cy, hrA, r * 0.42f, hand);

        // Minute
        hand.setStrokeWidth(Math.max(2.5f, sizePx * 0.025f));
        hand.setColor(0xFFFFE0B2);
        drawHand(c, cx, cy, minA, r * 0.58f, hand);

        // Second
        hand.setStrokeWidth(Math.max(1.5f, sizePx * 0.012f));
        hand.setColor(0xFFFFCC80);
        drawHand(c, cx, cy, secA, r * 0.70f, hand);

        // Center hub
        Paint hub = new Paint(Paint.ANTI_ALIAS_FLAG);
        hub.setColor(0xFFFFCC80);
        c.drawCircle(cx, cy, Math.max(3f, sizePx * 0.03f), hub);
        hub.setColor(0xFF1A1A1A);
        c.drawCircle(cx, cy, Math.max(1.5f, sizePx * 0.015f), hub);

        // Spider body near center (like the app)
        drawSpider(c, cx, cy + r * 0.02f, r * 0.14f);

        return bmp;
    }

    private static void drawHand(Canvas c, float cx, float cy, float angleDeg, float length, Paint paint) {
        double a = Math.toRadians(angleDeg);
        c.drawLine(
                cx, cy,
                cx + (float) Math.cos(a) * length,
                cy + (float) Math.sin(a) * length,
                paint
        );
    }

    private static void drawGears(Canvas c, float cx, float cy, float r, int sizePx) {
        Paint gear = new Paint(Paint.ANTI_ALIAS_FLAG);
        gear.setStyle(Paint.Style.FILL);

        // Outer gear ring
        gear.setColor(0x55E07A2F);
        Path teeth = new Path();
        int n = 24;
        float outer = r * 0.88f;
        float inner = r * 0.80f;
        for (int i = 0; i < n; i++) {
            double a0 = Math.toRadians(i * (360.0 / n) - 90);
            double a1 = Math.toRadians(i * (360.0 / n) + (360.0 / n) * 0.35 - 90);
            double a2 = Math.toRadians(i * (360.0 / n) + (360.0 / n) * 0.65 - 90);
            double a3 = Math.toRadians((i + 1) * (360.0 / n) - 90);
            if (i == 0) {
                teeth.moveTo(cx + (float) Math.cos(a0) * inner, cy + (float) Math.sin(a0) * inner);
            }
            teeth.lineTo(cx + (float) Math.cos(a0) * outer, cy + (float) Math.sin(a0) * outer);
            teeth.lineTo(cx + (float) Math.cos(a1) * outer, cy + (float) Math.sin(a1) * outer);
            teeth.lineTo(cx + (float) Math.cos(a2) * inner, cy + (float) Math.sin(a2) * inner);
            teeth.lineTo(cx + (float) Math.cos(a3) * inner, cy + (float) Math.sin(a3) * inner);
        }
        teeth.close();
        c.drawPath(teeth, gear);

        // Inner disc
        gear.setColor(0xFF8D3A08);
        c.drawCircle(cx, cy, r * 0.55f, gear);

        // Middle cog
        gear.setColor(0xFFC45C1A);
        c.drawCircle(cx, cy, r * 0.28f, gear);

        // Cog teeth small
        gear.setColor(0x66FFCC80);
        int n2 = 12;
        float o2 = r * 0.34f;
        float i2 = r * 0.26f;
        Path small = new Path();
        for (int i = 0; i < n2; i++) {
            double a0 = Math.toRadians(i * (360.0 / n2) - 90);
            double a1 = Math.toRadians(i * (360.0 / n2) + 10 - 90);
            double a2 = Math.toRadians((i + 1) * (360.0 / n2) - 10 - 90);
            if (i == 0) small.moveTo(cx + (float) Math.cos(a0) * i2, cy + (float) Math.sin(a0) * i2);
            small.lineTo(cx + (float) Math.cos(a0) * o2, cy + (float) Math.sin(a0) * o2);
            small.lineTo(cx + (float) Math.cos(a1) * o2, cy + (float) Math.sin(a1) * o2);
            small.lineTo(cx + (float) Math.cos(a2) * i2, cy + (float) Math.sin(a2) * i2);
        }
        small.close();
        c.drawPath(small, gear);
    }

    private static void drawSpider(Canvas c, float cx, float cy, float s) {
        Paint body = new Paint(Paint.ANTI_ALIAS_FLAG);
        body.setColor(0xFF1A1A1A);
        // abdomen
        c.drawOval(new RectF(cx - s * 0.55f, cy - s * 0.35f, cx + s * 0.55f, cy + s * 0.55f), body);
        // cephalothorax
        c.drawCircle(cx, cy - s * 0.35f, s * 0.32f, body);

        Paint leg = new Paint(Paint.ANTI_ALIAS_FLAG);
        leg.setColor(0xFF111111);
        leg.setStyle(Paint.Style.STROKE);
        leg.setStrokeWidth(Math.max(1.5f, s * 0.12f));
        leg.setStrokeCap(Paint.Cap.ROUND);

        // 3 legs each side
        float[] anglesL = {-50, -10, 30};
        float[] anglesR = {-130, -170, 150};
        for (float ang : anglesL) {
            double a = Math.toRadians(ang);
            c.drawLine(cx - s * 0.2f, cy,
                    cx - s * 0.2f + (float) Math.cos(a) * s * 1.4f,
                    cy + (float) Math.sin(a) * s * 1.4f, leg);
        }
        for (float ang : anglesR) {
            double a = Math.toRadians(ang);
            c.drawLine(cx + s * 0.2f, cy,
                    cx + s * 0.2f + (float) Math.cos(a) * s * 1.4f,
                    cy + (float) Math.sin(a) * s * 1.4f, leg);
        }
    }
}
