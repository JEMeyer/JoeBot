import weaviate, { WeaviateClient } from 'weaviate-ts-client';

const weaviateClient: WeaviateClient = weaviate.client({
  host: process.env.WEAVIATE_HOST ?? '',
  scheme: process.env.WEAVIATE_SCHEME,
});

interface DtChat {
  text: string;
  user: string;
  timestamp: string;
  channel: string;
}

export async function retrieveRelevantMessages(
  message: string,
  limit: number = 50
): Promise<DtChat[]> {
  // Query the Weaviate vector database to retrieve relevant messages
  const result = await weaviateClient.graphql
    .get()
    .withClassName('DtChat')
    .withFields('text user timestamp channel')
    .withLimit(limit)
    .withNearText({ concepts: [message] })
    .do();

  return result.data.Get.DtChat;
}
