import axios from 'axios';
import FormData from 'form-data';
import { bufferToStream } from './utilities';

const axiosInstance = axios.create({
  baseURL: process.env.BACKEND_URL,
  headers: {
    Authorization:
      'Basic ' +
      Buffer.from('KwisatzHaderach:' + process.env.API_TOKEN).toString(
        'base64'
      ),
  },
});

export async function callPromptToStoryboard(userPrompt: string) {
  const form = new FormData();
  form.append('prompt', userPrompt);
  try {
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
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(err.response?.statusText || 'Unknown error. Please try again.');
    }
    throw new Error('Unknown error. Please try again.');
  }
}

export async function callPromptToImagePrompt(userPrompt: string) {
  const payload = {
    prompt: userPrompt,
  };

  try {
    const response = await axiosInstance.post('/promptToImagePrompt', payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(err.response?.statusText || 'Unknown error. Please try again.');
    }
    throw new Error('Unknown error. Please try again.');
  }
}

type ImageGenerationData = {
  prompt: string;
  scale: number;
  steps: number;
  seed: number;
  localDiffusion: boolean;
};

export async function callPromptToImage(data: ImageGenerationData) {
  try {
    const response = await axiosInstance.post('/promptToImage', data, {
      headers: {
        'Content-Type': 'application/json',
      },
      responseType: 'arraybuffer',
    });

    const buffer = Buffer.from(response.data);
    const filename = response.headers['content-disposition']
      .split('filename=')[1]
      .replace(/"/g, '');

    return {
      stream: bufferToStream(buffer),
      fileName: `${filename}`,
    };
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(err.response?.statusText || 'Unknown error. Please try again.');
    }
    throw new Error('Unknown error. Please try again.');
  }
}

export async function generateImage(
  userPrompt: string,
  seed: number,
  scale: number,
  steps: number,
  localDiffusion: boolean,
  gpt: boolean
) {
  if (gpt) {
    userPrompt = await callPromptToImagePrompt(userPrompt);
  }
  const data: ImageGenerationData = {
    prompt: userPrompt,
    scale,
    steps,
    seed,
    localDiffusion,
  };

  const { stream, fileName } = await callPromptToImage(data);

  return {
    stream,
    fileName,
  };
}
