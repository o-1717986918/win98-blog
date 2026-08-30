import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { WASI } from 'node:wasi';

const wasmPath = new URL('../../public/solver/solver-engine.wasm', import.meta.url);
const provenancePath = new URL('./solver-engine.provenance.json', import.meta.url);
const bytes = await readFile(wasmPath);
const provenance = JSON.parse(await readFile(provenancePath, 'utf8'));
const actualHash = createHash('sha256').update(bytes).digest('hex');
if (actualHash !== provenance.sha256) {
  throw new Error(`Wasm artifact hash mismatch: expected ${provenance.sha256}, received ${actualHash}`);
}
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
const recognition = {
  path,
  length: api.solver_web_recognition_length(),
  turns: api.solver_web_recognition_turns(),
};
if (
  recognition.length !== provenance.contract.recognition.length
  || recognition.turns !== provenance.contract.recognition.turns
) {
  throw new Error(`Recognition contract changed: ${JSON.stringify(recognition)}`);
}
let planningPath = '';
if (full) {
  const planningPointer = api.solver_web_planning_path();
  let planningEnd = planningPointer;
  while (memory[planningEnd] !== 0) planningEnd++;
  planningPath = new TextDecoder().decode(memory.subarray(planningPointer, planningEnd));
}
const planning = {
  solved: Boolean(api.solver_web_planning_solved()),
  path: planningPath,
  length: api.solver_web_planning_length(),
  turns: api.solver_web_planning_turns(),
};
if (full && (
  planning.solved !== provenance.contract.planning.solved
  || planning.length !== provenance.contract.planning.length
  || planning.turns !== provenance.contract.planning.turns
)) {
  throw new Error(`Planning contract changed: ${JSON.stringify(planning)}`);
}
console.log(JSON.stringify({
  artifact: { sha256: actualHash, sourceCommit: provenance.source.commit },
  status,
  recognition,
  planning,
  elapsedMs: api.solver_web_elapsed_ms(),
}));
