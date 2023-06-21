import { Readable } from 'stream';

export async function sendTypingWhileAPICall(
  apiCallPromise: Promise<any>,
  callback: () => void
) {
  let typingInterval: string | number | NodeJS.Timer | undefined;

  // Start typing
  const startTyping = () => {
    typingInterval = setInterval(() => {
      callback();
    }, 9000); // Discord's typing indicator lasts for 10 seconds, so we refresh it every 9 seconds
  };

  // Stop typing
  const stopTyping = () => {
    clearInterval(typingInterval);
  };

  // Wrap the API call
  const callAPI = async () => {
    try {
      startTyping();
      const result = await apiCallPromise;
      stopTyping();
      return result;
    } catch (error) {
      stopTyping();
      throw error;
    }
  };

  return callAPI();
}

// Function to convert buffer to readable stream
export function bufferToStream(buffer: Buffer) {
  const readableStream = new Readable();
  readableStream.push(buffer);
  readableStream.push(null);
  return readableStream;
}

export const streamToBuffer = async (stream: Readable) => {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
};

export function createNewFilenameWithTimestamp(originalFilename: string) {
  const fileExtension = originalFilename?.split('.').pop();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const randomString = Math.random().toString(36).substr(2, 4);
  return `${timestamp}_${randomString}.${fileExtension}`;
}
