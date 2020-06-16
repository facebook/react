// @flow

import {
  Profile,
  FrameInfo,
  CallTreeProfileBuilder,
  ProfileGroup,
} from '../lib/profile';
import { getOrInsert, lastOf, sortBy, itForEach } from '../lib/utils';
import { TimeFormatter } from '../lib/value-formatters';
import { chromeTreeToNodes, OldCPUProfile } from './v8cpuFormatter';

// See: https://github.com/v8/v8/blob/master/src/inspector/js_protocol.json

export interface TimelineEvent {
  pid: number;
  tid: number;
  ts: number;
  ph: string;
  cat: string;
  name: string;
  dur: number;
  tdur: number;
  tts: number;
  args: { [key: string]: any };
  id?: String;
}

export function isChromeTimeline(rawProfile) {
  if (!Array.isArray(rawProfile)) return false;
  if (rawProfile.length < 1) return false;
  const first = rawProfile[0];
  if (!('pid' in first && 'tid' in first && 'ph' in first && 'cat' in first))
    return false;
  if (
    !rawProfile.find(
      e =>
        e.name === 'CpuProfile' ||
        e.name === 'Profile' ||
        e.name === 'ProfileChunk'
    )
  )
    return false;
  return true;
}
export function importFromChromeTimeline(
  events: TimelineEvent[],
  fileName: string
): ProfileGroup {
  // It seems like sometimes Chrome timeline files contain multiple CpuProfiles?
  // For now, choose the first one in the list.
  const cpuProfileByID = new Map();
  // Maps profile IDs (like "0x3") to pid/tid pairs formatted as `${pid}:${tid}`
  const pidTidById = new Map();
  // Maps pid/tid pairs to thread names
  const threadNameByPidTid = new Map();
  // The events aren't necessarily recorded in chronological order. Sort them so
  // that they are.
  sortBy(events, e => e.ts);
  for (let event of events) {
    if (event.name === 'CpuProfile') {
      const pidTid = `${event.pid}:${event.tid}`;
      const id = event.id || pidTid;
      cpuProfileByID.set(id, event.args.data.cpuProfile);
      pidTidById.set(id, pidTid);
    }
    if (event.name === 'Profile') {
      const pidTid = `${event.pid}:${event.tid}`;
      cpuProfileByID.set(
        event.id || pidTid,
        Object.assign(
          { startTime: 0, endTime: 0, nodes: [], samples: [], timeDeltas: [] },
          event.args.data
        )
      );
      if (event.id) {
        pidTidById.set(event.id, `${event.pid}:${event.tid}`);
      }
    }
    if (event.name === 'thread_name') {
      threadNameByPidTid.set(`${event.pid}:${event.tid}`, event.args.name);
    }
    if (event.name === 'ProfileChunk') {
      const pidTid = `${event.pid}:${event.tid}`;
      const cpuProfile = cpuProfileByID.get(event.id || pidTid);
      if (cpuProfile) {
        const chunk = event.args.data;
        if (chunk.cpuProfile) {
          if (chunk.cpuProfile.nodes) {
            cpuProfile.nodes = cpuProfile.nodes.concat(chunk.cpuProfile.nodes);
          }
          if (chunk.cpuProfile.samples) {
            cpuProfile.samples = cpuProfile.samples.concat(
              chunk.cpuProfile.samples
            );
          }
        }
        if (chunk.timeDeltas) {
          cpuProfile.timeDeltas = cpuProfile.timeDeltas.concat(
            chunk.timeDeltas
          );
        }
        if (chunk.startTime != null) {
          cpuProfile.startTime = chunk.startTime;
        }
        if (chunk.endTime != null) {
          cpuProfile.endTime = chunk.endTime;
        }
      } else {
        console.warn(
          `Ignoring ProfileChunk for undeclared Profile with id ${event.id ||
            pidTid}`
        );
      }
    }
  }
  if (cpuProfileByID.size > 0) {
    const profiles = [];
    let indexToView = 0;
    itForEach(cpuProfileByID.keys(), profileId => {
      let threadName = null;
      let pidTid = pidTidById.get(profileId);
      if (pidTid) {
        threadName = threadNameByPidTid.get(pidTid) || null;
        if (threadName) {
        }
      }
      const profile = importFromChromeCPUProfile(cpuProfileByID.get(profileId));
      if (threadName && cpuProfileByID.size > 1) {
        profile.setName(`${fileName} - ${threadName}`);
        if (threadName === 'CrRendererMain') {
          indexToView = profiles.length;
        }
      } else {
        profile.setName(`${fileName}`);
      }
      profiles.push(profile);
    });
    return { name: fileName, indexToView, profiles };
  } else {
    throw new Error('Could not find CPU profile in Timeline');
  }
}
const callFrameToFrameInfo = new Map();
function frameInfoForCallFrame(callFrame) {
  return getOrInsert(callFrameToFrameInfo, callFrame, callFrame => {
    const name = callFrame.functionName || '(anonymous)';
    const file = callFrame.url;
    const line = callFrame.lineNumber;
    const col = callFrame.columnNumber;
    return {
      key: `${name}:${file}:${line}:${col}`,
      name,
      file,
      line,
      col,
    };
  });
}
function shouldIgnoreFunction(callFrame) {
  const { functionName, url } = callFrame;
  if (url === 'native dummy.js') {
    // I'm not really sure what this is about, but this seems to be used
    // as a way of avoiding edge cases in V8's implementation.
    // See: https://github.com/v8/v8/blob/b8626ca4/tools/js2c.py#L419-L424
    return true;
  }
  return functionName === '(root)' || functionName === '(idle)';
}
function shouldPlaceOnTopOfPreviousStack(functionName) {
  return functionName === '(garbage collector)' || functionName === '(program)';
}
export function importFromChromeCPUProfile(chromeProfile) {
  const profile = new CallTreeProfileBuilder(
    chromeProfile.endTime - chromeProfile.startTime
  );
  const nodeById = new Map();
  for (let node of chromeProfile.nodes) {
    nodeById.set(node.id, node);
  }
  for (let node of chromeProfile.nodes) {
    if (typeof node.parent === 'number') {
      node.parent = nodeById.get(node.parent);
    }
    if (!node.children) continue;
    for (let childId of node.children) {
      const child = nodeById.get(childId);
      if (!child) continue;
      child.parent = node;
    }
  }
  const samples = [];
  const sampleTimes = [];
  // The first delta is relative to the profile startTime.
  // Ref: https://github.com/v8/v8/blob/44bd8fd7/src/inspector/js_protocol.json#L1485
  let elapsed = chromeProfile.timeDeltas[0];
  let lastNodeId = NaN;
  // The chrome CPU profile format doesn't collapse identical samples. We'll do that
  // here to save a ton of work later doing mergers.
  for (let i = 0; i < chromeProfile.samples.length; i++) {
    const nodeId = chromeProfile.samples[i];
    if (nodeId != lastNodeId) {
      samples.push(nodeId);
      sampleTimes.push(elapsed);
    }
    if (i === chromeProfile.samples.length - 1) {
      if (!isNaN(lastNodeId)) {
        samples.push(lastNodeId);
        sampleTimes.push(elapsed);
      }
    } else {
      let timeDelta = chromeProfile.timeDeltas[i + 1];
      if (timeDelta < 0) {
        // This is super noisy, but can be helpful when debugging strange data
        // console.warn('Substituting zero for unexpected time delta:', timeDelta, 'at index', i)
        timeDelta = 0;
      }
      elapsed += timeDelta;
      lastNodeId = nodeId;
    }
  }
  let prevStack = [];
  for (let i = 0; i < samples.length; i++) {
    const value = sampleTimes[i];
    const nodeId = samples[i];
    let stackTop = nodeById.get(nodeId);
    if (!stackTop) continue;
    // Find lowest common ancestor of the current stack and the previous one
    let lca = null;
    // This is O(n^2), but n should be relatively small here (stack height),
    // so hopefully this isn't much of a problem
    for (
      lca = stackTop;
      lca && prevStack.indexOf(lca) === -1;
      lca = shouldPlaceOnTopOfPreviousStack(lca.callFrame.functionName)
        ? lastOf(prevStack)
        : lca.parent || null
    ) {}
    // Close frames that are no longer open
    while (prevStack.length > 0 && lastOf(prevStack) != lca) {
      const closingNode = prevStack.pop();
      const frame = frameInfoForCallFrame(closingNode.callFrame);
      profile.leaveFrame(frame, value);
    }
    // Open frames that are now becoming open
    const toOpen = [];
    for (
      let node = stackTop;
      node && node != lca && !shouldIgnoreFunction(node.callFrame);
      // Place Chrome internal functions on top of the previous call stack
      node = shouldPlaceOnTopOfPreviousStack(node.callFrame.functionName)
        ? lastOf(prevStack)
        : node.parent || null
    ) {
      toOpen.push(node);
    }
    toOpen.reverse();
    for (let node of toOpen) {
      profile.enterFrame(frameInfoForCallFrame(node.callFrame), value);
    }
    prevStack = prevStack.concat(toOpen);
  }
  // Close frames that are open at the end of the trace
  for (let i = prevStack.length - 1; i >= 0; i--) {
    profile.leaveFrame(
      frameInfoForCallFrame(prevStack[i].callFrame),
      lastOf(sampleTimes)
    );
  }
  profile.setValueFormatter(new TimeFormatter('microseconds'));
  return profile.build();
}
export function importFromOldV8CPUProfile(content) {
  return importFromChromeCPUProfile(chromeTreeToNodes(content));
}
