import weaviate, { WeaviateClient } from 'weaviate-ts-client';
import { usersStore } from './slack-bot';

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

async function retrieveRelevantMessages(
  message: string,
  limit: number,
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

interface DtChat2 {
  text: string;
  timestamp: string;
  channel: string;
}

async function retrieveRelevantMessagesv2(
  message: string,
  limit: number,
): Promise<DtChat2[]> {
  // Query the Weaviate vector database to retrieve relevant messages
  const result = await weaviateClient.graphql
    .get()
    .withClassName('DtChat2')
    .withFields('text timestamp channel')
    .withLimit(limit)
    .withNearText({ concepts: [message] })
    .do();

  return result.data.Get.DtChat2;
}

export async function retrieveRelevantMessageContext(message: string, limit: number, version: number = 1) {
  switch (version) {
    case 2:
      return (await retrieveRelevantMessagesv2(message, limit)).map((chat) => `Channel ${chat.channel} timestamp ${chat.timestamp}:\n${chat.text}"`).join('\n');
    case 1:
    default:
      return (await retrieveRelevantMessages(message, limit)).map((chat) => `Channel ${chat.channel} timestamp ${chat.timestamp} user ${usersStore[chat.user]}:\n${chat.text.replace(/<@(U[A-Z0-9]+)>/g, (match, userId) => {
        return usersStore[userId] || match;
      })}"`).join('\n')
  }

}
