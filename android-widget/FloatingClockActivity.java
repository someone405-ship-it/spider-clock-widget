package com.spiderclock.widget;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.graphics.Color;
import android.os.Bundle;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

/** Same spider clock as the main app (full HTML/CSS/JS/SVG). */
public class FloatingClockActivity extends Activity {

    private WebView webView;
    private float startX;
    private float startY;
    private int lastAction;

    @SuppressLint({"SetJavaScriptEnabled", "ClickableViewAccessibility"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED |
                        WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
        );

        float density = getResources().getDisplayMetrics().density;
        int screenW = getResources().getDisplayMetrics().widthPixels;
        int w = (int) Math.min(screenW * 0.88f, 400 * density);
        int h = (int) (w * 1.12f);

        WindowManager.LayoutParams params = getWindow().getAttributes();
        params.gravity = Gravity.CENTER;
        params.width = w;
        params.height = h;
        getWindow().setAttributes(params);
        getWindow().setBackgroundDrawableResource(android.R.color.transparent);

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.parseColor("#a34a01"));

        int barH = (int) (30 * density);
        View dragBar = new View(this);
        dragBar.setBackgroundColor(Color.parseColor("#55000000"));
        dragBar.setLayoutParams(new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, barH, Gravity.TOP
        ));

        webView = new WebView(this);
        webView.setBackgroundColor(Color.parseColor("#a34a01"));
        FrameLayout.LayoutParams webLp = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
        );
        webLp.topMargin = barH;
        webView.setLayoutParams(webLp);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);

        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                view.evaluateJavascript(
                        "(function(){try{" +
                                "document.body.classList.remove('widget-mode','settings-open','edit-mode');" +
                                "var w=document.querySelector('.gsapWrapper');" +
                                "if(w){w.style.visibility='visible';w.style.opacity='1';}" +
                                "['.settings-btn','.edit-mode-btn','.settings-overlay'].forEach(function(s){" +
                                "var e=document.querySelector(s);if(e)e.style.display='none';});" +
                                "}catch(e){}})();",
                        null
                );
            }
        });
        webView.loadUrl("file:///android_asset/public/index.html");

        root.addView(webView);
        root.addView(dragBar);
        setContentView(root);

        dragBar.setOnTouchListener((v, event) -> {
            WindowManager.LayoutParams lp = getWindow().getAttributes();
            switch (event.getActionMasked()) {
                case MotionEvent.ACTION_DOWN: {
                    int[] loc = new int[2];
                    root.getLocationOnScreen(loc);
                    startX = event.getRawX() - loc[0];
                    startY = event.getRawY() - loc[1];
                    lastAction = MotionEvent.ACTION_DOWN;
                    return true;
                }
                case MotionEvent.ACTION_MOVE: {
                    lp.gravity = Gravity.TOP | Gravity.START;
                    lp.x = (int) (event.getRawX() - startX);
                    lp.y = (int) (event.getRawY() - startY);
                    getWindow().setAttributes(lp);
                    lastAction = MotionEvent.ACTION_MOVE;
                    return true;
                }
                case MotionEvent.ACTION_UP: {
                    if (lastAction == MotionEvent.ACTION_DOWN) finish();
                    return true;
                }
                default:
                    return false;
            }
        });
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.loadUrl("about:blank");
            webView.stopLoading();
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
