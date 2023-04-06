const axios = require('axios');
const FormData = require('form-data');

async function callPromptToStoryboard(userPrompt, isLocal = false) {
  const form = new FormData();
  form.append('prompt', userPrompt);

  const response = await axios.post(isLocal ? 'http://localhost:8080/promptToStoryboard' : 'https://storyboard.meyer.id/promptToStoryboard', form, {
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