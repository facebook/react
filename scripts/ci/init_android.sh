#!/bin/bash
set -e
SCRIPT_DIR=$(dirname $0)
cd $SCRIPT_DIR

if [[ $PERF_BROWSERS =~ .*Android.* || $E2E_BROWSERS =~ .*Android.* ]]
then
  adb root usb
  adb wait-for-device devices
  adb reverse tcp:8001 tcp:8001
  adb reverse tcp:8002 tcp:8002

  ./android_cpu.sh performance
  ./android_cpu.sh wakelock
fi
