/* tslint:disable */
/* eslint-disable */
export function init(): void;
export enum WasmModelType {
  MiniLML6V2 = 0,
}
export class Model {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
}
export class WasmModel {
  free(): void;
  [Symbol.dispose](): void;
  constructor(weights_data: Uint8Array, config_json: string, tokenizer_json: string);
  static from_type(model_type: WasmModelType): Promise<WasmModel>;
  encode(texts: string[], normalize: boolean): Float32Array;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_model_free: (a: number, b: number) => void;
  readonly __wbg_wasmmodel_free: (a: number, b: number) => void;
  readonly wasmmodel_new: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly wasmmodel_from_type: (a: number) => number;
  readonly wasmmodel_encode: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly init: () => void;
  readonly __wbindgen_export_0: (a: number) => void;
  readonly __wbindgen_export_1: (a: number, b: number, c: number) => void;
  readonly __wbindgen_export_2: (a: number, b: number) => number;
  readonly __wbindgen_export_3: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_export_4: WebAssembly.Table;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_export_5: (a: number, b: number, c: number) => void;
  readonly __wbindgen_export_6: (a: number, b: number, c: number, d: number) => void;
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
