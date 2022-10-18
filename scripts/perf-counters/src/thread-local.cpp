/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "thread-local.h"

#ifdef __linux__
#include <link.h>
#include <asm/prctl.h>
#include <sys/prctl.h>
extern "C" {
extern int arch_prctl(int, unsigned long*);
}
#endif //__linux__

namespace HPHP {

#ifdef USE_GCC_FAST_TLS

void ThreadLocalManager::OnThreadExit(void* p) {
  auto list = getList(p);
  p = list->head;
  delete list;
  while (p != nullptr) {
    auto* pNode = static_cast<ThreadLocalNode<void>*>(p);
    if (pNode->m_on_thread_exit_fn) {
      pNode->m_on_thread_exit_fn(p);
    }
    p = pNode->m_next;
  }
}

void ThreadLocalManager::PushTop(void* nodePtr, size_t nodeSize) {
  auto& node = *static_cast<ThreadLocalNode<void>*>(nodePtr);
  auto key = GetManager().m_key;
  auto list = getList(pthread_getspecific(key));
  if (UNLIKELY(!list)) {
    ThreadLocalSetValue(key, list = new ThreadLocalList);
  }
  node.m_next = list->head;
  node.m_size = nodeSize;
  list->head = node.m_next;
}

ThreadLocalManager& ThreadLocalManager::GetManager() {
  static ThreadLocalManager m;
  return m;
}

#ifdef __APPLE__
ThreadLocalManager::ThreadLocalList::ThreadLocalList() {
  pthread_t self = pthread_self();
  handler.__routine = ThreadLocalManager::OnThreadExit;
  handler.__arg = this;
  handler.__next = self->__cleanup_stack;
  self->__cleanup_stack = &handler;
}
#endif

#endif

#ifdef __linux__

static int visit_phdr(dl_phdr_info* info, size_t, void*) {
  for (size_t i = 0, n = info->dlpi_phnum; i < n; ++i) {
    const auto& hdr = info->dlpi_phdr[i];
    auto addr = info->dlpi_addr + hdr.p_vaddr;
    if (addr < 0x100000000LL && hdr.p_type == PT_TLS) {
      // found the main thread-local section
      assert(int(hdr.p_memsz) == hdr.p_memsz); // ensure no truncation
      return hdr.p_memsz;
    }
  }
  return 0;
}

std::pair<void*,size_t> getCppTdata() {
  uintptr_t addr;
  if (!arch_prctl(ARCH_GET_FS, &addr)) {
    // fs points to the end of the threadlocal area.
    size_t size = dl_iterate_phdr(&visit_phdr, nullptr);
    return {(void*)(addr - size), size};
  }
  return {nullptr, 0};
}

#else

// how do you find the thread local section on your system?
std::pair<void*,size_t> getCppTdata() {
  return {nullptr, 0};
}

#endif //__linux__

}
