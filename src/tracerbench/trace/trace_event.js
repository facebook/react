export const TRACE_EVENT_PHASE_BEGIN = 'B';
export const TRACE_EVENT_PHASE_END = 'E';
export const TRACE_EVENT_PHASE_COMPLETE = 'X';
export const TRACE_EVENT_PHASE_INSTANT = 'I';
export const TRACE_EVENT_PHASE_ASYNC_BEGIN = 'S';
export const TRACE_EVENT_PHASE_ASYNC_STEP_INTO = 'T';
export const TRACE_EVENT_PHASE_ASYNC_STEP_PAST = 'p';
export const TRACE_EVENT_PHASE_ASYNC_END = 'F';
export const TRACE_EVENT_PHASE_NESTABLE_ASYNC_BEGIN = 'b';
export const TRACE_EVENT_PHASE_NESTABLE_ASYNC_END = 'e';
export const TRACE_EVENT_PHASE_NESTABLE_ASYNC_INSTANT = 'n';
export const TRACE_EVENT_PHASE_FLOW_BEGIN = 's';
export const TRACE_EVENT_PHASE_FLOW_STEP = 't';
export const TRACE_EVENT_PHASE_FLOW_END = 'f';
export const TRACE_EVENT_PHASE_METADATA = 'M';
export const TRACE_EVENT_PHASE_COUNTER = 'C';
export const TRACE_EVENT_PHASE_SAMPLE = 'P';
export const TRACE_EVENT_PHASE_CREATE_OBJECT = 'N';
export const TRACE_EVENT_PHASE_SNAPSHOT_OBJECT = 'O';
export const TRACE_EVENT_PHASE_DELETE_OBJECT = 'D';
export const TRACE_EVENT_PHASE_MEMORY_DUMP = 'v';
export const TRACE_EVENT_PHASE_MARK = 'R';
export const TRACE_EVENT_PHASE_CLOCK_SYNC = 'c';
export const TRACE_EVENT_PHASE_ENTER_CONTEXT = '(';
export const TRACE_EVENT_PHASE_LEAVE_CONTEXT = ')';
export const TRACE_EVENT_PHASE_LINK_IDS = '=';
export const TRACE_EVENT_SCOPE_NAME_GLOBAL = 'g';
export const TRACE_EVENT_SCOPE_NAME_PROCESS = 'p';
export const TRACE_EVENT_SCOPE_NAME_THREAD = 't';

export const TRACE_EVENT_NAME = {
  TRACING_STARTED_IN_PAGE: 'TracingStartedInPage',
  PROFILE: 'Profile',
  PROFILE_CHUNK: 'ProfileChunk',
  CPU_PROFILE: 'CpuProfile',
  V8_EXECUTE: 'V8.Execute',
};

export const PROCESS_NAME = {
  BROWSER: 'Browser',
  RENDERER: 'Renderer',
  GPU: 'GPU Process',
};

export const TRACE_METADATA_NAME = {
  PROCESS_NAME: 'process_name',
  PROCESS_LABELS: 'process_labels',
  PROCESS_SORT_INDEX: 'process_sort_index',
  PROCESS_UPTIME_SECONDS: 'process_uptime_seconds',
  THREAD_NAME: 'thread_name',
  THREAD_SORT_INDEX: 'thread_sort_index',
  NUM_CPUS: 'num_cpus',
  TRACE_BUFFER_OVERFLOWED: 'trace_buffer_overflowed',
};