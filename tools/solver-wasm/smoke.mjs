import { readFile } from 'node:fs/promises';
import { WASI } from 'node:wasi';

const wasmPath = new URL('../../public/solver/solver-engine.wasm', import.meta.url);
const bytes = await readFile(wasmPath);
const wasi = new WASI({ version: 'preview1', args: [], env: {} });
const module = await WebAssembly.compile(bytes);
const instance = await WebAssembly.instantiate(module, { wasi_snapshot_preview1: wasi.wasiImport });
wasi.initialize(instance);

const api = instance.exports;
const memory = new Uint8Array(api.memory.buffer);
const input = [
  '################',
  '#---#------#---#',
  '#-$---####-.-*-#',
  '###-#----#-#---#',
  '#-*---##-$-#---#',
  '#-###--#---###-#',
  '#@--##-*-#---.-#',
  '###----#---###-#',
  '#---##-$-#-----#',
  '#-#----#---#.--#',
  '#---####---#####',
  '################',
].join('\n');
const encoded = new TextEncoder().encode(`${input}\0`);
const pointer = api.solver_web_input();
if (encoded.length > api.solver_web_input_capacity()) throw new Error('Map input exceeds Wasm buffer');
memory.set(encoded, pointer);

const full = process.argv.includes('--full');
const status = api.solver_web_run(full ? 1 : 0);
const pathPointer = api.solver_web_recognition_path();
let end = pathPointer;
while (memory[end] !== 0) end++;
const path = new TextDecoder().decode(memory.subarray(pathPointer, end));
if (status < 1 || path.length === 0) throw new Error(`Recognition failed: status=${status}, reason=${api.solver_web_fail_reason()}`);
let planningPath = '';
if (full) {
  const planningPointer = api.solver_web_planning_path();
  let planningEnd = planningPointer;
  while (memory[planningEnd] !== 0) planningEnd++;
  planningPath = new TextDecoder().decode(memory.subarray(planningPointer, planningEnd));
}
console.log(JSON.stringify({
  status,
  recognition: { path, length: api.solver_web_recognition_length(), turns: api.solver_web_recognition_turns() },
  planning: { solved: Boolean(api.solver_web_planning_solved()), path: planningPath, length: api.solver_web_planning_length(), turns: api.solver_web_planning_turns() },
  elapsedMs: api.solver_web_elapsed_ms(),
}));
