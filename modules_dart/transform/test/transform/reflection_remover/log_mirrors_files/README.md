Tests that the reflection removal step:
 1. Comments out the import of reflection_capabilities.dart
 2. Comments out the instantiation of `ReflectionCapabilities`
 3. Adds the appropriate import.
 4. Adds the call to `initReflector`
 5. Does not change line numbers in the source.
 6. Makes minimal changes to source offsets.