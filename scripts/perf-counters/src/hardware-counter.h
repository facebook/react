/*
   +----------------------------------------------------------------------+
   | HipHop for PHP                                                       |
   +----------------------------------------------------------------------+
   | Copyright (c) 2010-2015 Facebook, Inc. (http://www.facebook.com)     |
   +----------------------------------------------------------------------+
   | This source file is subject to version 3.01 of the PHP license,      |
   | that is bundled with this package in the file LICENSE, and is        |
   | available through the world-wide-web at the following url:           |
   | http://www.php.net/license/3_01.txt                                  |
   | If you did not receive a copy of the PHP license and are unable to   |
   | obtain it through the world-wide-web, please send a note to          |
   | license@php.net so we can mail you a copy immediately.               |
   +----------------------------------------------------------------------+
*/

#ifndef incl_HPHP_UTIL_HARDWARE_COUNTER_H_
#define incl_HPHP_UTIL_HARDWARE_COUNTER_H_

#include "hphp/util/thread-local.h"

#include <folly/Range.h>

#include <cstdint>
#include <vector>

namespace HPHP {
///////////////////////////////////////////////////////////////////////////////

#ifndef NO_HARDWARE_COUNTERS

class InstructionCounter;
class LoadCounter;
class StoreCounter;

struct PerfTable {
  const char* name;
  uint32_t type;
  uint64_t config;
};

class HardwareCounterImpl;

class HardwareCounter {
public:
  HardwareCounter();
  ~HardwareCounter();

  static void Reset();
  static int64_t GetInstructionCount();
  static int64_t GetLoadCount();
  static int64_t GetStoreCount();
  static bool SetPerfEvents(folly::StringPiece events);
  static void IncInstructionCount(int64_t amount);
  static void IncLoadCount(int64_t amount);
  static void IncStoreCount(int64_t amount);

  typedef void (*PerfEventCallback)(const std::string&, int64_t, void*);
  static void GetPerfEvents(PerfEventCallback f, void* data);
  static void ClearPerfEvents();
  static void Init(bool enable, const std::string& events, bool subProc);
  static DECLARE_THREAD_LOCAL_NO_CHECK(HardwareCounter, s_counter);
  bool m_countersSet{false};
private:
  void reset();
  int64_t getInstructionCount();
  int64_t getLoadCount();
  int64_t getStoreCount();
  bool eventExists(const char* event);
  bool addPerfEvent(const char* event);
  bool setPerfEvents(folly::StringPiece events);
  void getPerfEvents(PerfEventCallback f, void* data);
  void clearPerfEvents();

  std::unique_ptr<InstructionCounter> m_instructionCounter;
  std::unique_ptr<LoadCounter> m_loadCounter;
  std::unique_ptr<StoreCounter> m_storeCounter;
  std::vector<std::unique_ptr<HardwareCounterImpl>> m_counters;
};

#else // NO_HARDWARE_COUNTERS

/* Stub implementation for platforms without hardware counters (non-linux)
 * This mock class pretends to track performance events, but just returns
 * static values, so it doesn't even need to worry about thread safety
 * for the one static instance of itself.
 */
class HardwareCounter {
public:
  HardwareCounter() : m_countersSet(false) { }
  ~HardwareCounter() { }

  static void Reset() { }
  static int64_t GetInstructionCount() { return 0; }
  static int64_t GetLoadCount() { return 0; }
  static int64_t GetStoreCount() { return 0; }
  static bool SetPerfEvents(folly::StringPiece events) { return false; }
  static void IncInstructionCount(int64_t amount) {}
  static void IncLoadCount(int64_t amount) {}
  static void IncStoreCount(int64_t amount) {}
  typedef void (*PerfEventCallback)(const std::string&, int64_t, void*);
  static void GetPerfEvents(PerfEventCallback f, void* data) { }
  static void ClearPerfEvents() { }
  static void Init(bool enable, const std::string& events, bool subProc) {}

  // Normally exposed by DECLARE_THREAD_LOCAL_NO_CHECK
  void getCheck() { }
  void destroy() { }
  static HardwareCounter s_counter;
  bool m_countersSet;
};

#endif // NO_HARDWARE_COUNTERS

///////////////////////////////////////////////////////////////////////////////
}

#endif
