import initEdgeRag, { WasmModel, WasmModelType } from '/edgebert/pkg/edgebert.js';
import initEdgeBert, { EdgeRAG } from '/edgerag/pkg/edgerag.js';

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

    public async initialize(cachePath: string = '/cache/') {
        if (this.isInitialized) return;

        console.log('RAGService: Initializing...');
        try {
            // Step 1: Initialize the WASM modules first. This is crucial.
            await Promise.all([initEdgeBert(), initEdgeRag()]);
            console.log('RAGService: WASM modules loaded.');

            // Step 2: Fetch all the necessary data files
            const [chunksRes, textEmbeddingsRes, bm25IndexRes] = await Promise.all([
                fetch(`${cachePath}chunks.json`).then(r => r.text()),
                fetch(`${cachePath}text_embeddings.bin`).then(r => r.arrayBuffer()),
                fetch(`${cachePath}bm25_index.json`).then(r => r.text())
            ]);
            // console.log(chunksRes, textEmbeddingsRes, bm25IndexRes)

            // this.chunks = await chunksRes.json();
            // const textEmbeddings = await textEmbeddingsRes.arrayBuffer();
            // const bm25Index = await bm25IndexRes.json();
            console.log('RAGService: Data files fetched.');

            // Step 3: Create instances of your WASM-powered classes
            this.bertModel = WasmModel.from_type(WasmModelType.MiniLML6V2);
            this.ragIndex = new EdgeRAG();

            console.log('Bert and rag init')
            
            this.ragIndex.loadVectors(textEmbeddingsRes);
            this.ragIndex.loadBM25(bm25IndexRes);
            this.ragIndex.loadChunks(chunksRes);
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
            this.getSummarizer();

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