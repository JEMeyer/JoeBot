const axios = require('axios');
const FormData = require('form-data');

async function callPromptToStoryboard(userPrompt) {
  const form = new FormData();
  form.append('prompt', userPrompt);

  const response = await axios.post('http://localhost:12345/promptToStoryboard', form, {
    headers: form.getHeaders(),
    responseType: 'stream', // To receive the response as a stream
  });

  const contentDisposition = response.headers['content-disposition'];
  const fileName = contentDisposition
    ? contentDisposition.split('filename=')[1].replace(/["']/g, '')
    : 'output.mp4';

  return {
    stream: response.data,
    fileName,
  };
}

module.exports = {
  callPromptToStoryboard
};