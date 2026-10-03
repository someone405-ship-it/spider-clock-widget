package com.spiderclock.widget

import android.annotation.SuppressLint
import android.app.Activity
import android.graphics.Color
import android.os.Bundle
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout

/** Exact same spider clock page as the main app (gears + spider + animation). */
class FloatingClockActivity : Activity() {

    private var webView: WebView? = null
    private var startX = 0f
    private var startY = 0f
    private var lastAction = 0

    @SuppressLint("SetJavaScriptEnabled", "ClickableViewAccessibility")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        window.addFlags(
            WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED or
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
        )

        val dm = resources.displayMetrics
        val density = dm.density
        val w = (minOf(dm.widthPixels * 0.88f, 400 * density)).toInt()
        val h = (w * 1.12f).toInt()

        window.attributes = window.attributes.apply {
            gravity = Gravity.CENTER
            width = w
            height = h
        }
        window.setBackgroundDrawableResource(android.R.color.transparent)

        val root = FrameLayout(this).apply {
            setBackgroundColor(Color.parseColor("#a34a01"))
        }

        val barH = (30 * density).toInt()
        val dragBar = View(this).apply {
            setBackgroundColor(Color.parseColor("#55000000"))
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, barH, Gravity.TOP
            )
        }

        webView = WebView(this).apply {
            setBackgroundColor(Color.parseColor("#a34a01"))
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            ).apply { topMargin = barH }

            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                allowFileAccess = true
                allowContentAccess = true
                @Suppress("DEPRECATION")
                allowFileAccessFromFileURLs = true
                @Suppress("DEPRECATION")
                allowUniversalAccessFromFileURLs = true
                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                mediaPlaybackRequiresUserGesture = false
                cacheMode = WebSettings.LOAD_DEFAULT
                loadWithOverviewMode = true
                useWideViewPort = true
                builtInZoomControls = false
            }
            webChromeClient = WebChromeClient()
            webViewClient = object : WebViewClient() {
                override fun onPageFinished(view: WebView?, url: String?) {
                    // Match main app look: full clock visible, no overlay chrome
                    view?.evaluateJavascript(
                        """
                        (function(){
                          try {
                            document.body.classList.remove('widget-mode','settings-open','edit-mode');
                            var wrap = document.querySelector('.gsapWrapper');
                            if (wrap) {
                              wrap.style.visibility = 'visible';
                              wrap.style.opacity = '1';
                              wrap.style.position = '';
                              wrap.style.left = '';
                              wrap.style.top = '';
                            }
                            ['.settings-btn','.edit-mode-btn','.settings-overlay','.digital-time','.sc-toast'].forEach(function(sel){
                              var el = document.querySelector(sel);
                              if (el) el.style.display = 'none';
                            });
                            if (typeof window.onload === 'function') { try { window.onload(); } catch(e){} }
                          } catch (err) { console.error(err); }
                        })();
                        """.trim(),
                        null
                    )
                }
            }
            // Same files Capacitor ships in the main app
            loadUrl("file:///android_asset/public/index.html")
        }

        root.addView(webView)
        root.addView(dragBar)
        setContentView(root)

        dragBar.setOnTouchListener { _, event ->
            val lp = window.attributes
            when (event.actionMasked) {
                MotionEvent.ACTION_DOWN -> {
                    val loc = IntArray(2)
                    root.getLocationOnScreen(loc)
                    startX = event.rawX - loc[0]
                    startY = event.rawY - loc[1]
                    lastAction = MotionEvent.ACTION_DOWN
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    lp.gravity = Gravity.TOP or Gravity.START
                    lp.x = (event.rawX - startX).toInt()
                    lp.y = (event.rawY - startY).toInt()
                    window.attributes = lp
                    lastAction = MotionEvent.ACTION_MOVE
                    true
                }
                MotionEvent.ACTION_UP -> {
                    if (lastAction == MotionEvent.ACTION_DOWN) finish()
                    true
                }
                else -> false
            }
        }
    }

    override fun onDestroy() {
        webView?.apply {
            loadUrl("about:blank")
            stopLoading()
            destroy()
        }
        webView = null
        super.onDestroy()
    }
}
