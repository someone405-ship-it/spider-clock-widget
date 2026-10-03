#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
AND="$ROOT/android"
PKG_PATH="com/spiderclock/widget"
JAVA_SRC="$AND/app/src/main/java"
mkdir -p "$JAVA_SRC/$PKG_PATH"

cp "$ROOT/android-widget/FloatingClockActivity.java" "$JAVA_SRC/$PKG_PATH/"
cp "$ROOT/android-widget/SpiderClockWidget.java" "$JAVA_SRC/$PKG_PATH/"
# Remove Kotlin sources if present (project may not apply kotlin plugin)
rm -f "$JAVA_SRC/$PKG_PATH/FloatingClockActivity.kt" "$JAVA_SRC/$PKG_PATH/SpiderClockWidget.kt"

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

python3 << 'PY'
from pathlib import Path
import re
p = Path("android/app/src/main/AndroidManifest.xml")
t = p.read_text()
if "SYSTEM_ALERT_WINDOW" not in t:
    t = t.replace("<application", '    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />\n    <application', 1)
if "supportsPictureInPicture" not in t:
    t = re.sub(
        r'(<activity[^>]*android:name="\.MainActivity"[^>]*)',
        r'\1\n            android:supportsPictureInPicture="true"\n            android:resizeableActivity="true"',
        t, count=1)
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

python3 << 'PY'
from pathlib import Path
roots = list(Path("android/app/src/main/java").rglob("MainActivity.java"))
if not roots:
    print("MainActivity.java not found")
    raise SystemExit(0)
main = roots[0]
text = main.read_text()
if "SpiderNative" in text:
    print("MainActivity already patched")
    raise SystemExit(0)
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

echo "Android Java widget + floating clock injected."
