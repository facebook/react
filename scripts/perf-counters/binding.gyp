{
  "targets": [
    {
      "target_name": "perfcounters",
      "sources": [
        "src/hardware-counter.cpp",
        "src/perf-counters.cpp",
        "src/thread-local.cpp",
      ],
      "cflags": [
        "-Wno-sign-compare",
      ],
    },
  ],
}
