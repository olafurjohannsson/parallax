import initEdgeRag, { WasmModel, WasmModelType } from '../edgebert/pkg/edgebert.js';
import initEdgeBert, { EdgeRAG } from '../edgerag/pkg/edgerag.js';

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

export class RAGService {
    private static instance: RAGService;
    private isInitialized = false;
    private currentDocumentId: DocumentId | null = null;
    private bertModel: WasmModel | null = null;
    private ragIndex: EdgeRAG | null = null;
    private summarizer: SummarizationPipeline | null = null;
    private chunks: DocumentChunk[] = [];

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
            console.log('RAGService: WASM modules loaded.');

            const [chunksRes, textEmbeddingsRes, bm25IndexRes] = await Promise.all([
                fetch(paths.chunksUrl),
                fetch(paths.embeddingsUrl),
                fetch(paths.bm25Url)
            ]);

            const chunksJsonString = await chunksRes.text();
            const vectorStoreJsonString = await textEmbeddingsRes.text();
            const bm25JsonString = await bm25IndexRes.text();
            

            console.log(chunksJsonString.length,
                vectorStoreJsonString.length,
                bm25JsonString)

            // this.chunks = await chunksRes.json();
            // const textEmbeddings = await textEmbeddingsRes.arrayBuffer();
            // const bm25Index = await bm25IndexRes.json();
            console.log('RAGService: Data files fetched.');

            // Step 3: Create instances of your WASM-powered classes
            this.bertModel = WasmModel.from_type(WasmModelType.MiniLML6V2);
            this.ragIndex = new EdgeRAG();

            console.log('Bert and rag init')

            await this.ragIndex.loadChunks(chunksJsonString);
            await this.ragIndex.loadVectors(vectorStoreJsonString);
            await this.ragIndex.loadBM25(bm25JsonString);
            console.log('loaded')

            // Step 4: Load the data into the instances
            // await this.ragIndex.load_index(
            //     new Uint8Array(textEmbeddings),
            //     bm25Index
            // );

            console.log('RAGService: Search index loaded.');

            this.isInitialized = true;
            console.log('RAGService: Initialization complete. Ready to search.');

            // Step 5: Pre-load the summarizer in the background
            // this.getSummarizer();

        } catch (error) {
            console.error('RAGService: Failed to initialize.', error);
            this.isInitialized = false;
        }
    }

    private async getSummarizer(): Promise<SummarizationPipeline> {
        if (this.summarizer === null) {
            console.log('RAGService: Loading summarization model...');
            this.summarizer = await pipeline('summarization', 'Xenova/distilbart-cnn-12-6');
            console.log('RAGService: Summarization model loaded.');
        }
        return this.summarizer;
    }

    public async search(query: string, topK: number = 5): Promise<DocumentChunk[]> {
        if (!this.isInitialized || !this.bertModel || !this.ragIndex) {
            throw new Error('RAGService is not initialized yet.');
        }

        console.log(`RAGService: Searching for "${query}"...`);
        const queryEmbedding = await this.bertModel.embed(query);
        console.log('RAGService: Query embedded.');
        const resultIndices: number[] = this.ragIndex.search(queryEmbedding, topK);
        console.log('RAGService: Search complete. Found indices:', resultIndices);
        const relevantChunks = resultIndices.map(index => this.chunks[index]);
        return relevantChunks;
    }

    public async summarize(text: string): Promise<string> {
        if (!text.trim()) return "No text provided for summary.";
        const summarizer = await this.getSummarizer();
        console.log('RAGService: Summarizing content...');
        const result = await summarizer(text, {
            max_length: 150,
            min_length: 40,
        });
        console.log('RAGService: Summarization complete.');
        return result[0].summary_text;
    }
}