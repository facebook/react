build/jsc-perf: src/*
	mkdir -p build
	g++ -std=c++11 -I/usr/include/webkitgtk-1.0/ -ljavascriptcoregtk-1.0 src/jsc-perf.cpp src/hardware-counter.cpp src/thread-local.cpp -o build/jsc-perf
