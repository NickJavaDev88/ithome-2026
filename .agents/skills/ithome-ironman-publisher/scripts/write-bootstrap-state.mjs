#!/usr/bin/env node

import { chmodSync, closeSync, constants, fsyncSync, lstatSync, openSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { validateBootstrapState } from "./validate-bootstrap-state.mjs";

function fail(message) { process.stderr.write(`${message}\n`); process.exit(1); }

const argv = process.argv.slice(2);
if (argv.length !== 2 || argv[0] !== "--input") fail("Usage: write-bootstrap-state.mjs --input <state.json>");
const statePathValue = process.env.ITHOME_BOOTSTRAP_STATE || "/Users/Shared/ithome-ironman-bridge/state/series-bootstrap.json";
if (!isAbsolute(statePathValue)) fail("ITHOME_BOOTSTRAP_STATE must be absolute");
const statePath = resolve(statePathValue);
if (basename(statePath) !== "series-bootstrap.json") fail("Bootstrap state filename must be series-bootstrap.json");

let state;
try { state = JSON.parse(readFileSync(resolve(argv[1]), "utf8")); }
catch (error) { fail(`Cannot read bootstrap JSON: ${error.message}`); }
const errors = validateBootstrapState(state);
if (errors.length) fail(`Invalid bootstrap fields: ${errors.join(", ")}`);

const stateDir = dirname(statePath);
let directoryStat;
try { directoryStat = lstatSync(stateDir); } catch { fail("Bootstrap state directory does not exist; configure the bridge separately"); }
if (!directoryStat.isDirectory() || directoryStat.isSymbolicLink()) fail("Bootstrap state directory must be a direct directory");

try {
  const existingStat = lstatSync(statePath);
  if (!existingStat.isFile() || existingStat.isSymbolicLink()) fail("Existing bootstrap state must be a direct regular file");
  const existing = JSON.parse(readFileSync(statePath, "utf8"));
  if (existing.status === "verified" && (existing.seriesId !== state.seriesId || existing.seriesUrl !== state.seriesUrl || existing.articleUrl !== state.articleUrl)) {
    fail("Refusing to replace verified bootstrap identity with different values");
  }
} catch (error) {
  if (error?.code !== "ENOENT") fail(`Cannot validate existing bootstrap state: ${error.message}`);
}

const tempPath = join(stateDir, `.series-bootstrap-${randomUUID()}.tmp`);
let fd;
try {
  fd = openSync(tempPath, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY, 0o600);
  writeFileSync(fd, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  fsyncSync(fd);
  closeSync(fd); fd = undefined;
  JSON.parse(readFileSync(tempPath, "utf8"));
  chmodSync(tempPath, 0o640);
  renameSync(tempPath, statePath);
} catch (error) {
  if (fd !== undefined) closeSync(fd);
  try { unlinkSync(tempPath); } catch {}
  fail(`Failed to write bootstrap state atomically: ${error.message}`);
}

process.stdout.write(`${JSON.stringify({ status: "written", path: statePath, seriesId: state.seriesId })}\n`);
