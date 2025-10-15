declare global {
  function initEdgeBert(): Promise<any>;
  function initEdgeRag(): Promise<any>;
  
  // Define the types that the scripts will export globally
  const WasmModel: {
    from_type(type: any): any; // Use 'any' for simplicity or define the enum
  };
  const WasmModelType: any; // Add the enum if you know its structure

  class EdgeRAG {
    constructor();
    load_index(textEmbeddings: Uint8Array, bm25Index: any): Promise<void>;
    search(queryEmbedding: Float32Array, topK: number): number[];
  }

  // You might need to adjust the types based on your library's exact exports
  interface Window {
    initEdgeBert: typeof initEdgeBert;
    initEdgeRag: typeof initEdgeRag;
    WasmModel: typeof WasmModel;
    WasmModelType: typeof WasmModelType;
    EdgeRAG: typeof EdgeRAG;
  }
}

// You need this empty export to make it a module.
export {};