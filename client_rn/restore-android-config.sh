#!/usr/bin/env bash
# restore-android-config.sh
#
# Re-applies this machine's Android build configuration AFTER an
# `npx expo prebuild` / `prebuild --clean` regenerates the android/ folder.
#
# Usage:   ./restore-android-config.sh        (from the client_rn folder)
# Run it AFTER prebuild, BEFORE ./gradlew assembleRelease.
# Safe to run multiple times - it only updates/adds what is needed.

set -euo pipefail

# ---------------------------------------------------------------- settings --
# Edit these three lines if you move to another laptop:
ANDROID_SDK="${ANDROID_SDK:-$HOME/Android/Sdk}"
JDK17_HOME="${JDK17_HOME:-$HOME/.gradle/jdks/eclipse_adoptium-17-amd64-linux.2}" # or e.g. /usr/lib/jvm/java-17-openjdk-amd64
WORKERS="${BUILD_WORKERS:-6}"
# --------------------------------------------------------------------------- /

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ANDROID_DIR="$SCRIPT_DIR/android"
GRADLE_PROPS="$ANDROID_DIR/gradle.properties"
LOCAL_PROPS="$ANDROID_DIR/local.properties"

if [ ! -f "$GRADLE_PROPS" ]; then
  echo "ERROR: $GRADLE_PROPS does not exist."
  echo "=> Run 'npx expo prebuild --platform android' first, then re-run this script."
  exit 1
fi

# ---- local.properties -------------------------------------------------------
if [ -f "$LOCAL_PROPS" ] && grep -q '^sdk\.dir=' "$LOCAL_PROPS"; then
  sed -i "s|^sdk\.dir=.*|sdk.dir=$ANDROID_SDK|" "$LOCAL_PROPS"
else
  echo "sdk.dir=$ANDROID_SDK" > "$LOCAL_PROPS"
fi

# ---- gradle.properties ------------------------------------------------------
set_prop() { # set_prop <key> <value>  -> replace existing or append
  local key="$1" value="$2"
  if grep -q "^${key//./\\.}=" "$GRADLE_PROPS"; then
    sed -i "s|^${key//./\\.}=.*|${key}=${value}|" "$GRADLE_PROPS"
  else
    printf '\n# added by restore-android-config.sh\n%s=%s\n' "$key" "$value" >> "$GRADLE_PROPS"
  fi
}

# low-memory build profile for this laptop (6.6 GB RAM):
set_prop "org.gradle.jvmargs"          "-Xmx1536m -XX:MaxMetaspaceSize=512m"
set_prop "org.gradle.workers.max"      "$WORKERS"
set_prop "kotlin.daemon.jvmargs"       "-Xmx1024m"
set_prop "reactNativeArchitectures"    "arm64-v8a"

# pin the daemon JVM to a real JDK 17+ if we can find one
if [ -d "$JDK17_HOME" ]; then
  set_prop "org.gradle.java.home" "$JDK17_HOME"
else
  echo "NOTE: no JDK 17 at $JDK17_HOME - relying on \$JAVA_HOME from ~/.bashrc instead."
fi

# ---- summary -----------------------------------------------------------------
echo "✔ Restored Android build config:"
grep -E '^(org.gradle.java.home|org.gradle.jvmargs|org.gradle.workers.max|kotlin.daemon.jvmargs|reactNativeArchitectures)=' "$GRADLE_PROPS" | sed 's/^/    /'
grep '^sdk\.dir=' "$LOCAL_PROPS" | sed 's/^/    /'
