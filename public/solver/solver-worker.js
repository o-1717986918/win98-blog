let instancePromise;
let activeInstance;

const loadSolver = async () => {
  if (instancePromise) return instancePromise;
  instancePromise = (async () => {
    let instance;
    const imports = {
      wasi_snapshot_preview1: {
        clock_time_get(_clockId, _precision, outputPointer) {
          const view = new DataView(instance.exports.memory.buffer);
          view.setBigUint64(outputPointer, BigInt(Math.round(performance.now() * 1_000_000)), true);
          return 0;
        },
      },
    };
    const response = await fetch(new URL('./solver-engine.wasm', import.meta.url));
    if (!response.ok) throw new Error(`Wasm download failed (${response.status})`);
    const bytes = await response.arrayBuffer();
    const result = await WebAssembly.instantiate(bytes, imports);
    instance = result.instance;
    instance.exports._initialize();
    activeInstance = instance;
    return instance;
  })();
  return instancePromise;
};

const readString = (api, pointer) => {
  const memory = new Uint8Array(api.memory.buffer);
  let end = pointer;
  while (memory[end] !== 0) end++;
  return new TextDecoder().decode(memory.subarray(pointer, end));
};

self.onmessage = async ({ data }) => {
  if (data?.type !== 'solve') return;
  const started = performance.now();
  try {
    const instance = activeInstance ?? await loadSolver();
    const api = instance.exports;
    const encoded = new TextEncoder().encode(`${data.map}\0`);
    if (encoded.length > api.solver_web_input_capacity()) throw new Error('地图超过 Wasm 输入缓冲区。');
    new Uint8Array(api.memory.buffer).set(encoded, api.solver_web_input());
    const status = api.solver_web_run(data.planning ? 1 : 0);
    const endMap = [];
    for (let row = 0; row < api.solver_web_end_map_height(); row++) endMap.push(readString(api, api.solver_web_end_map_row(row)));
    self.postMessage({
      type: 'result',
      id: data.id,
      status,
      recognition: {
        solved: Boolean(api.solver_web_recognition_solved()),
        path: readString(api, api.solver_web_recognition_path()),
        length: api.solver_web_recognition_length(),
        turns: api.solver_web_recognition_turns(),
      },
      planning: {
        solved: Boolean(api.solver_web_planning_solved()),
        path: readString(api, api.solver_web_planning_path()),
        length: api.solver_web_planning_length(),
        turns: api.solver_web_planning_turns(),
      },
      entities: {
        boxes: [api.solver_web_boxes_completed(), api.solver_web_boxes_total()],
        bombs: [api.solver_web_bombs_detonated(), api.solver_web_bombs_total()],
      },
      failReason: api.solver_web_fail_reason(),
      engineMs: api.solver_web_elapsed_ms(),
      workerMs: performance.now() - started,
      endMap,
    });
  } catch (error) {
    self.postMessage({ type: 'error', id: data.id, message: error instanceof Error ? error.message : String(error) });
  }
};

loadSolver()
  .then(() => self.postMessage({ type: 'ready' }))
  .catch((error) => self.postMessage({ type: 'boot-error', message: error instanceof Error ? error.message : String(error) }));
