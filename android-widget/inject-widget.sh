#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
AND="$ROOT/android"
PKG_PATH="com/spiderclock/widget"
JAVA_SRC="$AND/app/src/main/java"
mkdir -p "$JAVA_SRC/$PKG_PATH"

cp "$ROOT/android-widget/SpiderClockWidget.kt" "$JAVA_SRC/$PKG_PATH/"
cp "$ROOT/android-widget/FloatingClockActivity.kt" "$JAVA_SRC/$PKG_PATH/"

RES="$AND/app/src/main/res"
mkdir -p "$RES/xml" "$RES/layout" "$RES/drawable" "$RES/values"
cp "$ROOT/android-widget/spider_clock_widget_info.xml" "$RES/xml/"
cp "$ROOT/android-widget/spider_clock_widget.xml" "$RES/layout/"
cp "$ROOT/android-widget/widget_background.xml" "$RES/drawable/"
cp "$ROOT/android-widget/widget_clock_face.xml" "$RES/drawable/"

if [ -f "$RES/values/strings.xml" ]; then
  if ! grep -q widget_description "$RES/values/strings.xml"; then
    sed -i 's#</resources>#    <string name="widget_description">Spider Clock with gears</string>\n    <string name="widget_name">Spider Clock</string>\n</resources>#' "$RES/values/strings.xml"
  fi
else
  cat > "$RES/values/strings.xml" << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Spider Clock</string>
    <string name="widget_description">Spider Clock with gears</string>
    <string name="widget_name">Spider Clock</string>
</resources>
EOF
fi

# Manifest: widget receiver + floating activity + PiP on main
python3 << 'PY'
from pathlib import Path
import re
p = Path("android/app/src/main/AndroidManifest.xml")
t = p.read_text()

# Permissions
if "SYSTEM_ALERT_WINDOW" not in t:
    t = t.replace(
        "<application",
        '    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />\n    <application',
        1,
    )

# PiP on main activity
if "supportsPictureInPicture" not in t:
    t = re.sub(
        r'(<activity[^>]*android:name="\.MainActivity"[^>]*)',
        r'\1\n            android:supportsPictureInPicture="true"\n            android:resizeableActivity="true"',
        t,
        count=1,
    )

extras = '''
        <receiver
            android:name=".SpiderClockWidget"
            android:exported="true"
            android:label="@string/widget_name">
            <intent-filter>
                <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
            </intent-filter>
            <meta-data
                android:name="android.appwidget.provider"
                android:resource="@xml/spider_clock_widget_info" />
        </receiver>
        <activity
            android:name=".FloatingClockActivity"
            android:exported="true"
            android:excludeFromRecents="true"
            android:launchMode="singleInstance"
            android:taskAffinity=""
            android:theme="@android:style/Theme.Translucent.NoTitleBar"
            android:resizeableActivity="true" />
'''

if "SpiderClockWidget" not in t:
    t = t.replace("</application>", extras + "\n    </application>")
elif "FloatingClockActivity" not in t:
    t = t.replace("</application>", '''
        <activity
            android:name=".FloatingClockActivity"
            android:exported="true"
            android:excludeFromRecents="true"
            android:launchMode="singleInstance"
            android:taskAffinity=""
            android:theme="@android:style/Theme.Translucent.NoTitleBar"
            android:resizeableActivity="true" />
    </application>''')

p.write_text(t)
print("Manifest patched")
PY

# Patch MainActivity for JS bridge + PiP
python3 << 'PY'
from pathlib import Path
import re
# Find MainActivity
roots = list(Path("android/app/src/main/java").rglob("MainActivity.*"))
if not roots:
    print("MainActivity not found")
    raise SystemExit(0)
main = roots[0]
text = main.read_text()
print("Patching", main)

if "SpiderNative" in text:
    print("Already patched")
    raise SystemExit(0)

# Kotlin or Java
if main.suffix == ".kt":
    patch = '''
    override fun onStart() {
        super.onStart()
        try {
            bridge.webView.addJavascriptInterface(SpiderBridge(), "SpiderNative")
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    inner class SpiderBridge {
        @android.webkit.JavascriptInterface
        fun openFloatingWidget() {
            runOnUiThread {
                startActivity(android.content.Intent(this@MainActivity, FloatingClockActivity::class.java))
            }
        }

        @android.webkit.JavascriptInterface
        fun enterPip() {
            runOnUiThread {
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                    val params = android.app.PictureInPictureParams.Builder().build()
                    enterPictureInPictureMode(params)
                }
            }
        }
    }
'''
    if "onStart" not in text:
        text = text.replace(
            "class MainActivity",
            "class MainActivity",
        )
        # insert before last closing brace of class
        idx = text.rfind("}")
        text = text[:idx] + patch + "\n}" + text[idx+1:]
    else:
        text = text + "\n// bridge patch skipped - onStart exists\n"
else:
    # Java MainActivity
    if "void onStart" not in text:
        insert = '''
    @Override
    public void onStart() {
        super.onStart();
        try {
            getBridge().getWebView().addJavascriptInterface(new Object() {
                @android.webkit.JavascriptInterface
                public void openFloatingWidget() {
                    runOnUiThread(() -> startActivity(new android.content.Intent(MainActivity.this, com.spiderclock.widget.FloatingClockActivity.class)));
                }
                @android.webkit.JavascriptInterface
                public void enterPip() {
                    runOnUiThread(() -> {
                        if (android.os.Build.VERSION.SDK_INT >= 26) {
                            enterPictureInPictureMode(new android.app.PictureInPictureParams.Builder().build());
                        }
                    });
                }
            }, "SpiderNative");
        } catch (Exception e) { e.printStackTrace(); }
    }
'''
        idx = text.rfind("}")
        text = text[:idx] + insert + "\n}\n"

main.write_text(text)
print("MainActivity patched")
PY

echo "Android floating full-clock widget + home widget injected."
