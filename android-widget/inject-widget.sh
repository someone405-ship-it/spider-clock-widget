#!/usr/bin/env bash
# Inject real Android App Widget into Capacitor android/ project
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
AND="$ROOT/android"
PKG_PATH="com/spiderclock/widget"

# Find applicationId / namespace folder
JAVA_SRC="$AND/app/src/main/java"
# Capacitor 6 uses the appId path
mkdir -p "$JAVA_SRC/$PKG_PATH"
cp "$ROOT/android-widget/SpiderClockWidget.kt" "$JAVA_SRC/$PKG_PATH/SpiderClockWidget.kt"

RES="$AND/app/src/main/res"
mkdir -p "$RES/xml" "$RES/layout" "$RES/drawable" "$RES/values"
cp "$ROOT/android-widget/spider_clock_widget_info.xml" "$RES/xml/"
cp "$ROOT/android-widget/spider_clock_widget.xml" "$RES/layout/"
cp "$ROOT/android-widget/widget_background.xml" "$RES/drawable/"

# strings
if [ -f "$RES/values/strings.xml" ]; then
  if ! grep -q widget_description "$RES/values/strings.xml"; then
    sed -i 's#</resources>#    <string name="widget_description">Spider Clock home screen widget</string>\n    <string name="widget_name">Spider Clock</string>\n</resources>#' "$RES/values/strings.xml"
  fi
else
  cat > "$RES/values/strings.xml" << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Spider Clock</string>
    <string name="widget_description">Spider Clock home screen widget</string>
    <string name="widget_name">Spider Clock</string>
</resources>
EOF
fi

# Register receiver in AndroidManifest.xml
MANIFEST="$AND/app/src/main/AndroidManifest.xml"
if ! grep -q SpiderClockWidget "$MANIFEST"; then
  # Insert before </application>
  python3 << 'PY'
from pathlib import Path
p = Path("android/app/src/main/AndroidManifest.xml")
t = p.read_text()
receiver = '''
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
'''
if "</application>" in t and "SpiderClockWidget" not in t:
    t = t.replace("</application>", receiver + "\n    </application>")
    p.write_text(t)
    print("Manifest updated")
else:
    print("Manifest already has widget or unexpected format")
PY
fi

echo "Android home-screen widget injected."
