#!/usr/bin/env node
// Captures an Android interaction sample from a connected device: per-frame timing from
// `dumpsys gfxinfo <pkg> framestats` plus per-thread CPU from /proc.
//
// The numbers only mean something when the scenario is the same on both sides of a change, so a
// capture is an explicit list of `input` actions plus a settle window. Run the baseline label
// before the change and the same actions under a second label after it.
//
//   node scripts/tablet-perf.mjs --label baseline-drag \
//     --swipe 525,960,720,960,700 --swipe 720,960,525,960,700
//
// Notes:
// - Jiffies are assumed to be 1/100 s, which is what Android arm64 uses, so CPU percentages carry
//   about a 1% error and only compare against each other.
// - FrameTimeline keeps the last ~120 frames, so a long capture only reports its tail. Keep the
//   window near two seconds and repeat captures instead of lengthening one.

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const JIFFIES_PER_SECOND = 100;

// Column order of the CSV `dumpsys gfxinfo <pkg> framestats` prints after ---PROFILEDATA---.
const COLUMN = {
  intendedVsync: 2,
  performTraversalsStart: 7,
  drawStart: 8,
  frameCompleted: 17,
};

function parseArgs(argv) {
  const options = {
    label: "capture",
    pkg: "sh.paseo.fold",
    settle: 1200,
    out: null,
    note: "",
    normalizeHandle: null,
    dragStart: null,
    dragY: 990,
    actions: [],
  };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    const value = argv[i + 1];
    switch (flag) {
      case "--label":
        options.label = value;
        i += 1;
        break;
      case "--package":
        options.pkg = value;
        i += 1;
        break;
      case "--settle":
        options.settle = Number(value);
        i += 1;
        break;
      case "--out":
        options.out = value;
        i += 1;
        break;
      case "--note":
        options.note = value;
        i += 1;
        break;
      case "--normalize-handle":
        options.normalizeHandle = Number(value);
        i += 1;
        break;
      case "--drag-start":
        options.dragStart = Number(value);
        i += 1;
        break;
      case "--y":
        options.dragY = Number(value);
        i += 1;
        break;
      case "--tap":
      case "--swipe":
      case "--key":
      case "--wait":
      case "--drag-handle":
        options.actions.push({ kind: flag.slice(2), value });
        i += 1;
        break;
      default:
        throw new Error(`Unknown argument: ${flag}`);
    }
  }
  if (options.actions.length === 0 && options.settle < 1000) {
    throw new Error("A capture needs actions or a settle window of at least 1000ms");
  }
  return options;
}

function adb(args) {
  return execFileSync("adb", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
}

function sleep(seconds) {
  execFileSync("sleep", [String(seconds)]);
}

function devicePid(pkg) {
  const pid = Number(adb(["shell", "pidof", pkg]).trim().split(/\s+/)[0]);
  if (!Number.isFinite(pid) || pid <= 0) {
    throw new Error(`No running process for ${pkg}`);
  }
  return pid;
}

/**
 * One call for every thread: `/proc/<pid>/task/<tid>/stat` puts utime and stime at fields 14 and
 * 15, which the comm field can shift because it may contain spaces. Split at the closing
 * parenthesis instead of by whitespace, and aggregate by thread name.
 */
function readThreadTimes(pid) {
  const text = adb(["shell", `for f in /proc/${pid}/task/*/stat; do cat $f; echo; done`]);
  const totals = new Map();
  for (const line of text.split("\n")) {
    const close = line.lastIndexOf(")");
    if (close < 0) continue;
    const name = line.slice(line.indexOf("(") + 1, close);
    const fields = line
      .slice(close + 2)
      .trim()
      .split(/\s+/);
    const cpu = Number(fields[11]) + Number(fields[12]);
    if (!Number.isFinite(cpu)) continue;
    totals.set(name, (totals.get(name) ?? 0) + cpu);
  }
  return totals;
}

function parseFrames(text) {
  const frames = [];
  let inData = false;
  for (const line of text.split("\n")) {
    if (line.startsWith("---PROFILEDATA---")) {
      inData = !inData;
      continue;
    }
    if (!inData) continue;
    const cells = line.split(",");
    if (cells.length < 18) continue;
    const frame = {};
    let valid = true;
    for (const [key, index] of Object.entries(COLUMN)) {
      const value = Number(cells[index]);
      if (!Number.isFinite(value)) {
        valid = false;
        break;
      }
      frame[key] = value;
    }
    if (valid) frames.push(frame);
  }
  return frames;
}

function percentile(values, q) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))];
}

function round(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function distribution(values, digits = 1) {
  return {
    p50: round(percentile(values, 0.5), digits),
    p90: round(percentile(values, 0.9), digits),
    p99: round(percentile(values, 0.99), digits),
    max: round(Math.max(...values), digits),
  };
}

function summarizeFrames(frames) {
  const usable = frames
    .filter((frame) => frame.intendedVsync > 0 && frame.frameCompleted >= frame.intendedVsync)
    .sort((left, right) => left.intendedVsync - right.intendedVsync);
  if (usable.length < 5) return { frames: usable.length };

  const latency = usable.map((frame) => (frame.frameCompleted - frame.intendedVsync) / 1e6);
  const uiQueue = usable.map((frame) => (frame.performTraversalsStart - frame.intendedVsync) / 1e6);
  const record = usable.map((frame) => (frame.drawStart - frame.performTraversalsStart) / 1e6);
  const gaps = [];
  for (let i = 1; i < usable.length; i += 1) {
    gaps.push((usable[i].intendedVsync - usable[i - 1].intendedVsync) / 1e6);
  }

  return {
    frames: usable.length,
    latencyMs: distribution(latency),
    framesOver32Ms: latency.filter((value) => value > 32).length,
    framesOver100Ms: latency.filter((value) => value > 100).length,
    uiQueueMs: distribution(uiQueue),
    recordMs: distribution(record, 2),
    gapMs: distribution(gaps),
  };
}

function summarizeThreads(before, after, seconds) {
  const rows = [];
  for (const name of new Set([...before.keys(), ...after.keys()])) {
    const delta = (after.get(name) ?? 0) - (before.get(name) ?? 0);
    if (delta <= 0) continue;
    rows.push({ name, percent: round((delta / JIFFIES_PER_SECOND / seconds) * 100) });
  }
  rows.sort((left, right) => right.percent - left.percent);
  const totalCores = round(rows.reduce((total, row) => total + row.percent, 0) / 100, 2);
  return { totalCores, threads: rows.slice(0, 10) };
}

function runActions(actions) {
  for (const action of actions) {
    switch (action.kind) {
      case "tap":
        adb(["shell", "input", "tap", ...action.value.split(",")]);
        break;
      case "swipe":
        adb(["shell", "input", "swipe", ...action.value.split(",")]);
        break;
      case "key":
        adb(["shell", "input", "keyevent", action.value]);
        break;
      case "wait":
        sleep(Number(action.value) / 1000);
        break;
      case "drag-handle": {
        // Deltas alternate direction so a capture starts and ends at the same width. Each swipe
        // starts where the previous one ended, which keeps the grab inside the 54px grip column
        // without re-measuring; the activation offset is far smaller than that column.
        const y = options.dragStart == null ? resolveHandle().y : options.dragY;
        const handleX = options.dragStart ?? resolveHandle().x;
        let x = handleX;
        for (const token of action.value.split(",")) {
          const [delta, duration = "600"] = token.split(":").map(Number);
          adb([
            "shell",
            "input",
            "swipe",
            String(x),
            String(y),
            String(x + delta),
            String(y),
            String(duration),
          ]);
          x += delta;
        }
        break;
      }
      default:
        throw new Error(`Unsupported action: ${action.kind}`);
    }
  }
}

let handle = null;

/** Sidebar width, or null when no wide layout is on screen. */
function readSidebarWidthOrNull() {
  try {
    return readSidebarEdge();
  } catch {
    return null;
  }
}

/**
 * Right edge of the sidebar, in device pixels, from one `screencap`. The frame is raw RGBA behind a
 * four-word header; scanning many rows and taking the most common first channel edge finds the
 * sidebar border without a UI dump, which would wait for idle that a live board never reaches.
 */
function readSidebarEdge() {
  const frame = execFileSync("adb", ["exec-out", "screencap"], { maxBuffer: 64 * 1024 * 1024 });
  const header = 16;
  const width = frame.readUInt32LE(0);
  const height = frame.readUInt32LE(4);
  const stride = Math.floor((frame.length - header) / height);
  if (!width || !height || stride < width * 4) {
    throw new Error("Unexpected screencap frame");
  }
  const votes = new Map();
  for (let y = Math.round(height * 0.25); y < height * 0.85; y += 24) {
    const row = header + y * stride;
    for (let x = Math.round(width * 0.1); x < Math.round(width * 0.6); x += 1) {
      const current = row + x * 4;
      const previous = current - 4;
      const delta =
        Math.abs(frame[current] - frame[previous]) +
        Math.abs(frame[current + 1] - frame[previous + 1]) +
        Math.abs(frame[current + 2] - frame[previous + 2]);
      if (delta > 18) {
        votes.set(x, (votes.get(x) ?? 0) + 1);
        break;
      }
    }
  }
  let best = null;
  for (const [x, count] of votes) {
    if (!best || count > best.count) best = { x, count };
  }
  if (!best) throw new Error("No sidebar edge found; is a wide layout on screen?");
  return best.x;
}

/** Center-right of the desktop sidebar's resize grip, in device pixels. */
function resolveHandle() {
  if (!handle) {
    handle = { x: readSidebarEdge() - 14, y: 990 };
  }
  return handle;
}

/**
 * Drives the sidebar to a known px width before the measurement window. `input swipe` loses a few
 * pixels per gesture to the activation offset, so a drag sequence does not return to its starting
 * width by itself; both sides of a comparison normalize here instead.
 */
function normalizeHandleWidth(targetPx) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const right = readSidebarEdge();
    const delta = targetPx - right;
    if (process.env.PASEO_PERF_DEBUG) console.error(`[normalize] edge=${right} delta=${delta}`);
    // A pan of a few pixels never activates (the resize handle needs ~12px of horizontal intent),
    // so treat anything under that as converged instead of looping forever.
    if (Math.abs(delta) <= 12) return;
    // Long sweeps need a slow gesture: a fast one gets treated as a fling and the drag is dropped.
    const duration = Math.max(800, Math.min(4000, Math.round(Math.abs(delta) * 3)));
    adb([
      "shell",
      "input",
      "swipe",
      String(right - 14),
      "990",
      String(right - 14 + delta),
      "990",
      String(duration),
    ]);
    sleep(0.4);
  }
}

const options = parseArgs(process.argv.slice(2));
const pid = devicePid(options.pkg);
// Resolve any handle geometry before the measurement window opens: a UI dump waits for idle and
// would otherwise be counted as interaction cost.
if (options.normalizeHandle != null) {
  normalizeHandleWidth(options.normalizeHandle);
}
if (options.actions.some((action) => action.kind === "drag-handle") && options.dragStart == null) {
  resolveHandle();
}
const device = {
  model: adb(["shell", "getprop", "ro.product.model"]).trim(),
  sdk: Number(adb(["shell", "getprop", "ro.build.version.sdk"]).trim()),
  density: Number(adb(["shell", "getprop", "ro.sf.lcd_density"]).trim()),
  versionName: adb(["shell", "dumpsys", "package", options.pkg])
    .split("\n")
    .find((line) => line.includes("versionName="))
    ?.split("versionName=")[1]
    ?.trim(),
};

const sidebarWidthBefore = readSidebarWidthOrNull();
adb(["shell", "dumpsys", "gfxinfo", options.pkg, "reset"]);
const startedAt = Date.now();
const threadsBefore = readThreadTimes(pid);
runActions(options.actions);
sleep(options.settle / 1000);
const threadsAfter = readThreadTimes(pid);
const windowSeconds = (Date.now() - startedAt) / 1000;
const frames = parseFrames(adb(["shell", "dumpsys", "gfxinfo", options.pkg, "framestats"]));
const sidebarWidthAfter = readSidebarWidthOrNull();

const capture = {
  label: options.label,
  capturedAt: new Date().toISOString(),
  note: options.note,
  device,
  scenario: {
    actions: options.actions,
    settleMs: options.settle,
    windowSeconds: round(windowSeconds, 2),
    // Cohorts are only comparable when the sidebar started and ended at the same width.
    sidebarWidthBefore,
    sidebarWidthAfter,
  },
  frames: summarizeFrames(frames),
  cpu: summarizeThreads(threadsBefore, threadsAfter, windowSeconds),
};

const outPath = resolve(root, options.out ?? `docs/qa-evidence/tablet-perf/${options.label}.json`);
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(capture, null, 2)}\n`);

const { frames: f, cpu } = capture;
if (f.frames < 5) {
  console.warn(
    `${options.label}: FrameTimeline held ${f.frames} frames. Nothing drew during the window, which is what an idle capture of a static screen looks like; only CPU is meaningful here.`,
  );
}
console.log(`${options.label}: ${f.frames} frames, ${cpu.totalCores} cores`);
if (f.latencyMs) {
  console.log(
    `  latency p50=${f.latencyMs.p50} p90=${f.latencyMs.p90} p99=${f.latencyMs.p99} max=${f.latencyMs.max}ms` +
      `  >32ms=${f.framesOver32Ms} >100ms=${f.framesOver100Ms}`,
  );
  console.log(
    `  uiQueue p50=${f.uiQueueMs.p50} p90=${f.uiQueueMs.p90} max=${f.uiQueueMs.max}ms` +
      `  record p50=${f.recordMs.p50} p90=${f.recordMs.p90}ms`,
  );
  console.log(
    `  gap p50=${f.gapMs.p50} p90=${f.gapMs.p90} p99=${f.gapMs.p99} max=${f.gapMs.max}ms`,
  );
}
console.log(`  cpu: ${cpu.threads.map((row) => `${row.name} ${row.percent}%`).join(", ")}`);
console.log(`  wrote ${outPath}`);
