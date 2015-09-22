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
        "-std=c++0x",
        "-Wno-sign-compare",
      ],
    },
  ],
}
