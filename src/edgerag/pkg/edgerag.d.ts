/* tslint:disable */
/* eslint-disable */
export class EdgeRAG {
  free(): void;
  [Symbol.dispose](): void;
  constructor();
  loadVectors(json: string): void;
  loadBM25(json: string): void;
  loadChunks(json: string): void;
  search(query_embedding: Float32Array, query_text: string, k: number): any;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_edgerag_free: (a: number, b: number) => void;
  readonly edgerag_new: () => number;
  readonly edgerag_loadVectors: (a: number, b: number, c: number) => [number, number];
  readonly edgerag_loadBM25: (a: number, b: number, c: number) => [number, number];
  readonly edgerag_loadChunks: (a: number, b: number, c: number) => [number, number];
  readonly edgerag_search: (a: number, b: number, c: number, d: number, e: number, f: number) => any;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_export_3: WebAssembly.Table;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
