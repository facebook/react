/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "hardware-counter.h"

#ifndef NO_HARDWARE_COUNTERS

#define _GNU_SOURCE 1
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <errno.h>
#include <assert.h>
#include <sys/mman.h>
#include <sys/ioctl.h>
#include <asm/unistd.h>
#include <sys/prctl.h>
#include <linux/perf_event.h>

namespace HPHP {
///////////////////////////////////////////////////////////////////////////////

IMPLEMENT_THREAD_LOCAL_NO_CHECK(HardwareCounter,
    HardwareCounter::s_counter);

static bool s_recordSubprocessTimes = false;
static bool s_profileHWEnable;
static std::string s_profileHWEvents;

static inline bool useCounters() {
#ifdef VALGRIND
  return false;
#else
  return s_profileHWEnable;
#endif
}

class HardwareCounterImpl {
public:
  HardwareCounterImpl(int type, unsigned long config,
                      const char* desc = nullptr)
    : m_desc(desc ? desc : ""), m_err(0), m_fd(-1), inited(false) {
    memset (&pe, 0, sizeof (struct perf_event_attr));
    pe.type = type;
    pe.size = sizeof (struct perf_event_attr);
    pe.config = config;
    pe.inherit = s_recordSubprocessTimes;
    pe.disabled = 1;
    pe.pinned = 0;
    pe.exclude_kernel = 0;
    pe.exclude_hv = 1;
    pe.read_format =
      PERF_FORMAT_TOTAL_TIME_ENABLED|PERF_FORMAT_TOTAL_TIME_RUNNING;
    }

  ~HardwareCounterImpl() {
    close();
  }

  void init_if_not() {
    /*
     * perf_event_open(struct perf_event_attr *hw_event_uptr, pid_t pid,
     *                 int cpu, int group_fd, unsigned long flags)
     */
    if (inited) return;
    inited = true;
    m_fd = syscall(__NR_perf_event_open, &pe, 0, -1, -1, 0);
    if (m_fd < 0) {
      // Logger::Verbose("perf_event_open failed with: %s",
      //                 folly::errnoStr(errno).c_str());
      m_err = -1;
      return;
    }
    if (ioctl(m_fd, PERF_EVENT_IOC_ENABLE, 0) < 0) {
      // Logger::Warning("perf_event failed to enable: %s",
      //                 folly::errnoStr(errno).c_str());
      close();
      m_err = -1;
      return;
    }
    reset();
  }

  int64_t read() {
    uint64_t values[3];
    if (readRaw(values)) {
      if (!values[2]) return 0;
      int64_t value = (double)values[0] * values[1] / values[2];
      return value + extra;
    }
    return 0;
  }

  void incCount(int64_t amount) {
    extra += amount;
  }

  bool readRaw(uint64_t* values) {
    if (m_err || !useCounters()) return false;
    init_if_not();

    if (m_fd > 0) {
      /*
       * read the count + scaling values
       *
       * It is not necessary to stop an event to read its value
       */
      auto ret = ::read(m_fd, values, sizeof(*values) * 3);
      if (ret == sizeof(*values) * 3) {
        values[0] -= reset_values[0];
        values[1] -= reset_values[1];
        values[2] -= reset_values[2];
        return true;
      }
    }
    return false;
  }

  void reset() {
    if (m_err || !useCounters()) return;
    init_if_not();
    extra = 0;
    if (m_fd > 0) {
      if (ioctl (m_fd, PERF_EVENT_IOC_RESET, 0) < 0) {
        // Logger::Warning("perf_event failed to reset with: %s",
        //                 folly::errnoStr(errno).c_str());
        m_err = -1;
        return;
      }
      auto ret = ::read(m_fd, reset_values, sizeof(reset_values));
      if (ret != sizeof(reset_values)) {
        // Logger::Warning("perf_event failed to reset with: %s",
        //                 folly::errnoStr(errno).c_str());
        m_err = -1;
        return;
      }
    }
  }

public:
  std::string m_desc;
  int m_err;
private:
  int m_fd;
  struct perf_event_attr pe;
  bool inited;
  uint64_t reset_values[3];
  uint64_t extra{0};

  void close() {
    if (m_fd > 0) {
      ::close(m_fd);
      m_fd = -1;
    }
  }
};

class InstructionCounter : public HardwareCounterImpl {
public:
  InstructionCounter() :
    HardwareCounterImpl(PERF_TYPE_HARDWARE, PERF_COUNT_HW_INSTRUCTIONS) {}
};

class LoadCounter : public HardwareCounterImpl {
public:
  LoadCounter() :
    HardwareCounterImpl(PERF_TYPE_HW_CACHE,
        (PERF_COUNT_HW_CACHE_L1D | ((PERF_COUNT_HW_CACHE_OP_READ) << 8))) {}
};

class StoreCounter : public HardwareCounterImpl {
public:
  StoreCounter() :
    HardwareCounterImpl(PERF_TYPE_HW_CACHE,
        PERF_COUNT_HW_CACHE_L1D | ((PERF_COUNT_HW_CACHE_OP_WRITE) << 8)) {}
};

HardwareCounter::HardwareCounter()
  : m_countersSet(false) {
  m_instructionCounter.reset(new InstructionCounter());
  if (s_profileHWEvents.empty()) {
    m_loadCounter.reset(new LoadCounter());
    m_storeCounter.reset(new StoreCounter());
  } else {
    m_countersSet = true;
    setPerfEvents(s_profileHWEvents);
  }
}

HardwareCounter::~HardwareCounter() {
}

void HardwareCounter::Init(bool enable, const std::string& events,
                           bool subProc) {
  s_profileHWEnable = enable;
  s_profileHWEvents = events;
  s_recordSubprocessTimes = subProc;
}

void HardwareCounter::Reset() {
  s_counter->reset();
}

void HardwareCounter::reset() {
  m_instructionCounter->reset();
  if (!m_countersSet) {
    m_storeCounter->reset();
    m_loadCounter->reset();
  }
  for (unsigned i = 0; i < m_counters.size(); i++) {
    m_counters[i]->reset();
  }
}

int64_t HardwareCounter::GetInstructionCount() {
  return s_counter->getInstructionCount();
}

int64_t HardwareCounter::getInstructionCount() {
  return m_instructionCounter->read();
}

int64_t HardwareCounter::GetLoadCount() {
  return s_counter->getLoadCount();
}

int64_t HardwareCounter::getLoadCount() {
  return m_loadCounter->read();
}

int64_t HardwareCounter::GetStoreCount() {
  return s_counter->getStoreCount();
}

int64_t HardwareCounter::getStoreCount() {
  return m_storeCounter->read();
}

void HardwareCounter::IncInstructionCount(int64_t amount) {
  s_counter->m_instructionCounter->incCount(amount);
}

void HardwareCounter::IncLoadCount(int64_t amount) {
  if (!s_counter->m_countersSet) {
    s_counter->m_loadCounter->incCount(amount);
  }
}

void HardwareCounter::IncStoreCount(int64_t amount) {
  if (!s_counter->m_countersSet) {
    s_counter->m_storeCounter->incCount(amount);
  }
}

struct PerfTable perfTable[] = {
  /* PERF_TYPE_HARDWARE events */
#define PC(n)    PERF_TYPE_HARDWARE, PERF_COUNT_HW_ ## n
  { "cpu-cycles",              PC(CPU_CYCLES)              },
  { "cycles",                  PC(CPU_CYCLES)              },
  { "instructions",            PC(INSTRUCTIONS)            },
  { "cache-references",        PC(CACHE_REFERENCES)        },
  { "cache-misses",            PC(CACHE_MISSES)            },
  { "branch-instructions",     PC(BRANCH_INSTRUCTIONS)     },
  { "branches",                PC(BRANCH_INSTRUCTIONS)     },
  { "branch-misses",           PC(BRANCH_MISSES)           },
  { "bus-cycles",              PC(BUS_CYCLES)              },
  { "stalled-cycles-frontend", PC(STALLED_CYCLES_FRONTEND) },
  { "stalled-cycles-backend",  PC(STALLED_CYCLES_BACKEND)  },

  /* PERF_TYPE_HW_CACHE hw_cache_id */
#define PCC(n)   PERF_TYPE_HW_CACHE, PERF_COUNT_HW_CACHE_ ## n
  { "L1-dcache-",          PCC(L1D)                },
  { "L1-icache-",          PCC(L1I)                },
  { "LLC-",                PCC(LL)                 },
  { "dTLB-",               PCC(DTLB)               },
  { "iTLB-",               PCC(ITLB)               },
  { "branch-",             PCC(BPU)                },

  /* PERF_TYPE_HW_CACHE hw_cache_op, hw_cache_result */
#define PCCO(n, m)  PERF_TYPE_HW_CACHE, \
                    ((PERF_COUNT_HW_CACHE_OP_ ## n) << 8 | \
                    (PERF_COUNT_HW_CACHE_RESULT_ ## m) << 16)
  { "loads",               PCCO(READ, ACCESS)      },
  { "load-misses",         PCCO(READ, MISS)        },
  { "stores",              PCCO(WRITE, ACCESS)     },
  { "store-misses",        PCCO(WRITE, MISS)       },
  { "prefetches",          PCCO(PREFETCH, ACCESS)  },
  { "prefetch-misses",     PCCO(PREFETCH, MISS)    }
};

static int findEvent(const char *event, struct PerfTable *t,
                     int len, int *match_len) {
  int i;

  for (i = 0; i < len; i++) {
    if (!strncmp(event, t[i].name, strlen(t[i].name))) {
      *match_len = strlen(t[i].name);
      return i;
    }
  }
  return -1;
}

#define CPUID_STEPPING(x)  ((x) & 0xf)
#define CPUID_MODEL(x)     (((x) & 0xf0) >> 4)
#define CPUID_FAMILY(x)    (((x) & 0xf00) >> 8)
#define CPUID_TYPE(x)      (((x) & 0x3000) >> 12)

// hack to get LLC counters on perflab frc machines
static bool isIntelE5_2670() {
#ifdef __x86_64__
  unsigned long x;
  asm volatile ("cpuid" : "=a"(x): "a"(1) : "ebx", "ecx", "edx");
  return CPUID_STEPPING(x) == 6 && CPUID_MODEL(x) == 0xd
         && CPUID_FAMILY(x) == 6 && CPUID_TYPE(x) == 0;
#else
  return false;
#endif
}

static void checkLLCHack(const char* event, uint32_t& type, uint64_t& config) {
  if (!strncmp(event, "LLC-load", 8) && isIntelE5_2670()) {
    type = PERF_TYPE_RAW;
    if (!strncmp(&event[4], "loads", 5)) {
      config = 0x534f2e;
    } else if (!strncmp(&event[4], "load-misses", 11)) {
      config = 0x53412e;
    }
  }
}

bool HardwareCounter::addPerfEvent(const char* event) {
  uint32_t type = 0;
  uint64_t config = 0;
  int i, match_len;
  bool found = false;
  const char* ev = event;

  while ((i = findEvent(ev, perfTable,
                        sizeof(perfTable)/sizeof(struct PerfTable),
                        &match_len))
       != -1) {
    if (!found) {
      found = true;
      type = perfTable[i].type;
    } else if (type != perfTable[i].type) {
      // Logger::Warning("failed to find perf event: %s", event);
      return false;
    }
    config |= perfTable[i].config;
    ev = &ev[match_len];
  }

  checkLLCHack(event, type, config);

  // Check if we have a raw spec.
  if (!found && event[0] == 'r' && event[1] != 0) {
    config = strtoull(event + 1, const_cast<char**>(&ev), 16);
    if (*ev == 0) {
      found = true;
      type = PERF_TYPE_RAW;
    }
  }

  if (!found || *ev) {
    // Logger::Warning("failed to find perf event: %s", event);
    return false;
  }
  std::unique_ptr<HardwareCounterImpl> hwc(
      new HardwareCounterImpl(type, config, event));
  if (hwc->m_err) {
    // Logger::Warning("failed to set perf event: %s", event);
    return false;
  }
  m_counters.emplace_back(std::move(hwc));
  if (!m_countersSet) {
    // reset load and store counters. This is because
    // perf does not seem to handle more than three counters
    // very well.
    m_loadCounter.reset();
    m_storeCounter.reset();
    m_countersSet = true;
  }
  return true;
}

bool HardwareCounter::eventExists(const char *event) {
  // hopefully m_counters set is small, so a linear scan does not hurt
  for(unsigned i = 0; i < m_counters.size(); i++) {
    if (!strcmp(event, m_counters[i]->m_desc.c_str())) {
      return true;
    }
  }
  return false;
}

bool HardwareCounter::setPerfEvents(std::string sevents) {
  // Make a copy of the string for use with strtok.
  auto const sevents_buf = static_cast<char*>(malloc(sevents.size() + 1));
  memcpy(sevents_buf, sevents.data(), sevents.size());
  sevents_buf[sevents.size()] = '\0';

  char* strtok_buf = nullptr;
  char* s = strtok_r(sevents_buf, ",", &strtok_buf);
  bool success = true;
  while (s) {
    if (!eventExists(s) && !addPerfEvent(s)) {
      success = false;
      break;
    }
    s = strtok_r(nullptr, ",", &strtok_buf);
  }
  free(sevents_buf);
  return success;
}

bool HardwareCounter::SetPerfEvents(std::string events) {
  return s_counter->setPerfEvents(events);
}

void HardwareCounter::clearPerfEvents() {
  m_counters.clear();
}

void HardwareCounter::ClearPerfEvents() {
  s_counter->clearPerfEvents();
}

const std::string
  s_instructions("instructions"),
  s_loads("loads"),
  s_stores("stores");

void HardwareCounter::getPerfEvents(PerfEventCallback f, void* data) {
  f(s_instructions, getInstructionCount(), data);
  if (!m_countersSet) {
    f(s_loads, getLoadCount(), data);
    f(s_stores, getStoreCount(), data);
  }
  for (unsigned i = 0; i < m_counters.size(); i++) {
    f(m_counters[i]->m_desc, m_counters[i]->read(), data);
  }
}

void HardwareCounter::GetPerfEvents(PerfEventCallback f, void* data) {
  s_counter->getPerfEvents(f, data);
}

///////////////////////////////////////////////////////////////////////////////
}


#else // NO_HARDWARE_COUNTERS

namespace HPHP {
///////////////////////////////////////////////////////////////////////////////

HardwareCounter HardwareCounter::s_counter;

///////////////////////////////////////////////////////////////////////////////
}

#endif // NO_HARDWARE_COUNTERS
