package com.spiderclock.widget

import android.annotation.SuppressLint
import android.app.Activity
import android.graphics.Color
import android.os.Bundle
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout

/**
 * Floating window with the REAL spider clock (same HTML/CSS/JS/SVG as the app).
 * Shows gears + spider animation — not emoji text.
 */
class FloatingClockActivity : Activity() {

    private var webView: WebView? = null
    private var dX = 0f
    private var dY = 0f
    private var lastAction = 0

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        window.addFlags(
            WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED or
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
        )

        val density = resources.displayMetrics.density
        val size = (280 * density).toInt()

        val params = window.attributes
        params.gravity = Gravity.TOP or Gravity.END
        params.x = (12 * density).toInt()
        params.y = (80 * density).toInt()
        params.width = size
        params.height = size + (36 * density).toInt()
        window.attributes = params
        window.setBackgroundDrawableResource(android.R.color.transparent)

        val root = FrameLayout(this)
        root.setBackgroundColor(Color.parseColor("#a34a01"))

        val dragBar = View(this).apply {
            setBackgroundColor(Color.parseColor("#33000000"))
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                (28 * density).toInt(),
                Gravity.TOP
            )
        }

        webView = WebView(this).apply {
            setBackgroundColor(Color.parseColor("#a34a01"))
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            ).apply {
                topMargin = (28 * density).toInt()
            }
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.allowFileAccess = true
            settings.allowContentAccess = true
            settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            settings.mediaPlaybackRequiresUserGesture = false
            settings.cacheMode = WebSettings.LOAD_DEFAULT
            webViewClient = WebViewClient()
            // Same assets Capacitor uses — full SVG spider + gears + GSAP
            loadUrl("file:///android_asset/public/index.html")
        }

        root.addView(webView)
        root.addView(dragBar)
        setContentView(root)

        // Drag the floating window by the top bar
        dragBar.setOnTouchListener { _, event ->
            val lp = window.attributes
            when (event.actionMasked) {
                MotionEvent.ACTION_DOWN -> {
                    dX = event.rawX - lp.x
                    dY = event.rawY - lp.y
                    lastAction = MotionEvent.ACTION_DOWN
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    lp.x = (event.rawX - dX).toInt()
                    lp.y = (event.rawY - dY).toInt()
                    // Switch gravity to TOP|START so x/y work consistently
                    lp.gravity = Gravity.TOP or Gravity.START
                    window.attributes = lp
                    lastAction = MotionEvent.ACTION_MOVE
                    true
                }
                MotionEvent.ACTION_UP -> {
                    if (lastAction == MotionEvent.ACTION_DOWN) {
                        // tap on bar = close floating widget
                        finish()
                    }
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
