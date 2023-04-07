const axios = require('axios');
const FormData = require('form-data');
const { bufferToStream } = require('./utilities.js')

const axiosInstance = axios.create({
  baseURL: 'https://storyboard.meyer.id',
  headers: {
    'Authorization': 'Basic ' + Buffer.from('KwisatzHaderach:' + process.env.API_TOKEN).toString('base64'),
  },
});

const devAxiosInstance = axios.create({
  baseURL: 'http://localhost:8080',
  headers: {
    'Authorization': 'Basic ' + Buffer.from('KwisatzHaderach:' + process.env.API_TOKEN_DEV).toString('base64'),
  },
});

async function callPromptToStoryboard(userPrompt, dev) {
  const form = new FormData();
  form.append('prompt', userPrompt);

  const instance = dev ? devAxiosInstance : axiosInstance;

  const response = await instance.post('/promptToStoryboard', form, {
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

async function callPromptToImagePrompt(userPrompt, dev) {
  const payload = {
    prompt: userPrompt
  };

  const instance = dev ? devAxiosInstance : axiosInstance;

  const response = await instance.post('/promptToImagePrompt', payload, {
    headers: {
      'Content-Type': 'application/json'
    }
  });

  return response.data;
}

/* data:
prompt,
    scale,
    steps,
    seed,
    localDiffusion */
async function callPromptToImage(data, dev) {
  const instance = dev ? devAxiosInstance : axiosInstance;

  const response = await instance.post('/promptToImage', data, {
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

async function generateImage(userPrompt, seed, scale, steps, localDiffusion, dev,  gpt) {
  if (gpt) {
      userPrompt = await callPromptToImagePrompt(userPrompt, dev);
  }
  const data = {
      prompt: userPrompt,
      scale,
      steps,
      seed,
      localDiffusion
  };

  const {stream, fileName} = await callPromptToImage(data, dev);

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