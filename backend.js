const axios = require('axios');
const FormData = require('form-data');
const { bufferToStream } = require('./utilities.js')

const axiosInstance = axios.create({
  baseURL: process.env.BACKEND_URL,
  headers: {
    'Authorization': 'Basic ' + Buffer.from('KwisatzHaderach:' + process.env.API_TOKEN).toString('base64'),
  },
});

async function callPromptToStoryboard(userPrompt) {
  const form = new FormData();
  form.append('prompt', userPrompt);

  const response = await axiosInstance.post('/promptToStoryboard', form, {
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

async function callPromptToImagePrompt(userPrompt) {
  const payload = {
    prompt: userPrompt
  };

  const response = await axiosInstance.post('/promptToImagePrompt', payload, {
    headers: {
      'Content-Type': 'application/json'
    }
  });

  return response.data;
}

async function callPromptToImage(data) {

  const response = await axiosInstance.post('/promptToImage', data, {
    headers: {
      'Content-Type': 'application/json'
    },
    responseType: 'arraybuffer'
  });

  const buffer = Buffer.from(response.data);
  const filename = response.headers['content-disposition'].split('filename=')[1].replace(/"/g, '');

  return {
    stream: bufferToStream(buffer),
    fileName: `${filename}`,
  };
}

async function generateImage(userPrompt, seed, scale, steps, localDiffusion,  gpt) {
  if (gpt) {
      userPrompt = await callPromptToImagePrompt(userPrompt);
  }
  const data = {
      prompt: userPrompt,
      scale,
      steps,
      seed,
      localDiffusion
  };

  const {stream, fileName} = await callPromptToImage(data);

  return {
      stream,
      fileName,
  };
}

module.exports = {
  callPromptToImage,
  callPromptToImagePrompt,
  callPromptToStoryboard,
  generateImage
};