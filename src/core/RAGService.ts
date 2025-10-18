import initEdgeBert, { WasmModel, WasmModelType } from '../edgebert/pkg/edgebert.js';
import initEdgeRag, { EdgeRAG } from '../edgerag/pkg/edgerag.js';

import { documentRegistry, DocumentId } from './DocumentRegistry';
import { pipeline, SummarizationPipeline } from '@xenova/transformers';

// Define a type for our rich chunk data
export interface DocumentChunk {
    id: string;
    content: {
        type: 'text' | 'image' | 'table';
        text?: { html: string };
        image?: { image_path: string, caption: string };
        table?: { html: string };
    };
    metadata: {
        document_title: string;
        page_number: number;
    };
}

export interface SearchResult {
    score: number;
    chunk: DocumentChunk;
    search_type: 'keyword' | 'semantic' | 'hybrid';
}

export class RAGService {
    private static instance: RAGService;
    private isInitialized = false;
    private currentDocumentId: DocumentId | null = null;
    private bertModel: WasmModel | null = null;
    private ragIndex: EdgeRAG | null = null;
    private summarizer: SummarizationPipeline | null = null;
    private chunks: DocumentChunk[] = [];
    private chunkMap: Map<string, DocumentChunk> = new Map();

    private constructor() { }

    public static getInstance(): RAGService {
        if (!RAGService.instance) {
            RAGService.instance = new RAGService();
        }
        return RAGService.instance;
    }

    public async initialize(documentId: DocumentId) {
        if (this.isInitialized && this.currentDocumentId === documentId) {
            console.log(`RAGService: Index for "${documentId}" is already loaded.`);
            return;
        }

        console.log(`RAGService: Initializing for index "${documentId}"...`);
        this.isInitialized = false;
        this.currentDocumentId = documentId;
        const paths = documentRegistry[documentId];
        if (!paths) {
            throw new Error(`RAGService: No document found in registry for ID: ${documentId}`);
        }

        try {

            await Promise.all([initEdgeBert(), initEdgeRag()]);

            const [chunksRes, textEmbeddingsRes, bm25IndexRes] = await Promise.all([
                fetch(paths.chunksUrl),
                fetch(paths.embeddingsUrl),
                fetch(paths.bm25Url)
            ]);

            const chunksJsonString = await chunksRes.text();
            const vectorStoreJsonString = await textEmbeddingsRes.text();
            const bm25JsonString = await bm25IndexRes.text();

            this.chunks = JSON.parse(chunksJsonString);
            this.chunkMap.clear();
            this.chunks.forEach(chunk => this.chunkMap.set(chunk.id, chunk));

            // Step 3: Create instances of your WASM-powered classes
            this.bertModel = await WasmModel.from_type(WasmModelType.MiniLML6V2);
            this.ragIndex = new EdgeRAG();

            console.log('Bert and rag init')

            await this.ragIndex.loadChunks(chunksJsonString);
            await this.ragIndex.loadVectors(vectorStoreJsonString);
            await this.ragIndex.loadBM25(bm25JsonString);
            console.log('loaded')



            console.log('RAGService: Search index loaded.');

            this.isInitialized = true;
            console.log('RAGService: Initialization complete. Ready to search.');


        } catch (error) {
            console.error('RAGService: Failed to initialize.', error);
            this.isInitialized = false;
        }
    }

 

    public async search(query: string, topK: number = 5): Promise<DocumentChunk[]> {
        if (!this.isInitialized || !this.bertModel || !this.ragIndex) {
            throw new Error('RAGService is not initialized yet.');
        }

        console.log(`RAGService: Searching for "${query}"...`);
        const queryEmbedding = this.bertModel.encode([query], true);
        console.log('RAGService: Query embedded.');
        const searchResults: SearchResult[] = this.ragIndex.search(
            Array.from(queryEmbedding),
            query,
            topK
        );
        console.log('RAGService: Search complete. Found results:', searchResults);

        // Extract just the rich chunk data from the search results
        const relevantChunks = searchResults.map(result => result.chunk);

        return relevantChunks;
    }


}