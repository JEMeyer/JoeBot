const { Readable } = require('stream');

async function sendTypingWhileAPICall(apiCallPromise, message) {
  let typingInterval;

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
function bufferToStream(buffer) {
  const readableStream = new Readable();
  readableStream.push(buffer);
  readableStream.push(null);
  return readableStream;
}

module.exports = {
  bufferToStream,
  sendTypingWhileAPICall
};