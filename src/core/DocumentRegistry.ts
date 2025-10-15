// import apolloChunksUrl from '../assets/cache/apollo11_missionreport/chunks.json?url';
// import apolloEmbeddingsUrl from '../assets/cache/apollo11_missionreport/text_embeddings.json?url';
// import apolloBm25Url from '../assets/cache/apollo11_missionreport/bm25_index.json?url';

// --- ISS Knowledge Base ---
import issChunksUrl from '../assets/cache/iss/chunks.json?url';
import issEmbeddingsUrl from '../assets/cache/iss/text_embeddings.json?url';
import issBm25Url from '../assets/cache/iss/bm25_index.json?url';


export const documentRegistry = {
//   'apollo11_missionreport': {
//     chunksUrl: apolloChunksUrl,
//     embeddingsUrl: apolloEmbeddingsUrl,
//     bm25Url: apolloBm25Url,
//   },
  'iss': {
    chunksUrl: issChunksUrl,
    embeddingsUrl: issEmbeddingsUrl,
    bm25Url: issBm25Url,
  },
  
};

export type DocumentId = keyof typeof documentRegistry;