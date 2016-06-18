#!/bin/bash
set -e

CPUPATH=/sys/devices/system/cpu
WAKE_LOCK_NAME=ngperf

set_governor() {
  echo "Setting CPU frequency governor to \"$1\""
  adb shell 'for f in '$CPUPATH'/cpu*/cpufreq/scaling_governor ; do echo '$1' > $f; done'
}

wake_lock() {
  echo "Setting wake lock $WAKE_LOCK_NAME"
  adb shell "echo $WAKE_LOCK_NAME > /sys/power/wake_lock"
}

wake_unlock() {
  echo "Removing wake lock $WAKE_LOCK_NAME"
  adb shell "echo $WAKE_LOCK_NAME > /sys/power/wake_unlock"
}

case "$1" in
  (performance)
    set_governor "performance"
    ;;
  (powersave)
    set_governor "powersave"
    ;;
  (ondemand)
    set_governor "ondemand"
    ;;
  (wakelock)
    wake_lock
    ;;
  (wakeunlock)
    wake_unlock
    ;;
  (*)
    echo "Usage: $0 performance|powersave|ondemand|wakelock|wakeunlock"
    exit 1
    ;;
esac
