Tests that the reflection removal step:
 1. Comments out reflective `bootstrap.dart` import
 1. Adds `bootstrap_static.dart` import
 1. Adds the call to `initReflector`
 1. Handles bootstrap return values properly
