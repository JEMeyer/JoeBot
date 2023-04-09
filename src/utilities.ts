import { Message } from 'discord.js';
import { Readable } from 'stream';

export async function sendTypingWhileAPICall(
  apiCallPromise: Promise<any>,
  message: Message<boolean>
) {
  let typingInterval: string | number | NodeJS.Timer | undefined;

  // Start typing
  const startTyping = () => {
    typingInterval = setInterval(() => {
      message.channel.sendTyping();
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
