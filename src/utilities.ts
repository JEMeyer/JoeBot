import { Readable } from 'stream';
import * as fs from 'fs';
import crypto from 'crypto';

export async function sendTypingWhileAPICall(
  apiCallPromise: Promise<any>,
  callback: () => void
) {
  let typingInterval: NodeJS.Timeout | undefined;

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

export function generateFilename(originalFilename: string) {
  // Extract file extension
  const fileExtension = originalFilename?.split('.').pop();

  // Get current date components
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-based
  const day = String(now.getDate()).padStart(2, '0');

  const timestamp = `${year}-${month}-${day}`;

  // Filename without extension
  const baseFilename = originalFilename?.split('.').slice(0, -1).join('.');

  // Generate unique identifier in case of collision
  const uniqueId = crypto.randomBytes(4).toString('hex');

  // Combine components to form the final filename
  return `${timestamp}_${baseFilename}_${uniqueId}.${fileExtension}`;
}

export function saveFile(
  filePath: string,
  fileName: string,
  fileContent: Buffer | ArrayBuffer
): Promise<void> {
  return new Promise((resolve, reject) => {
    let buffer: Buffer;

    if (fileContent instanceof Buffer) {
      buffer = fileContent;
    } else {
      buffer = Buffer.from(fileContent);
    }

    fs.writeFile(`${filePath}/${fileName}`, buffer, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export const MAX_TIMEOUT = 300 * 1000; // 300 seconds in milliseconds
