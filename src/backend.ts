import axios from 'axios';
import FormData from 'form-data';
import { MAX_TIMEOUT, bufferToStream } from './utilities';
import { ChatRequest, GenerateRequest } from './ollama-types';

const axiosInstance = axios.create({
  baseURL: process.env.BACKEND_URL,
  headers: {
    Authorization:
      'Basic ' + Buffer.from(process.env.API_TOKEN || '').toString('base64'),
  },
});

export async function callPromptToStoryboard(userPrompt: string) {
  const form = new FormData();
  form.append('prompt', userPrompt);
  try {
    const response = await axiosInstance.post('/promptToStoryboard', form, {
      headers: form.getHeaders(),
      responseType: 'stream', // To receive the response as a stream
      timeout: MAX_TIMEOUT,
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
      throw new Error(
        err.response?.statusText || 'Unknown error. Please try again.'
      );
    }
    throw new Error('Unknown error. Please try again.');
  }
}

export async function callPromptToImagePrompt(
  userPrompt: string
): Promise<{ prompt: string; negPrompt: string }> {
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
      throw new Error(
        err.response?.statusText || 'Unknown error. Please try again.'
      );
    }
    throw new Error(JSON.stringify(err));
  }
}

type ImageGenerationData = {
  prompt: string;
  negPrompt?: string;
  scale: number;
  steps: number;
  seed: number;
  secondaryServer: boolean;
};

export async function callPromptToImage(data: ImageGenerationData) {
  try {
    const response = await axiosInstance.post('/promptToImage', data, {
      headers: {
        'Content-Type': 'application/json',
      },
      responseType: 'arraybuffer',
      timeout: MAX_TIMEOUT,
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
      throw new Error(
        err.response?.statusText || 'Unknown error. Please try again.'
      );
    }
    throw new Error('Unknown error. Please try again.');
  }
}

export async function generateImage(
  userPrompt: string,
  seed: number,
  scale: number,
  steps: number,
  gpt: boolean,
  secondaryServer: boolean
) {
  let upscaledPrompt;
  if (gpt) {
    upscaledPrompt = await callPromptToImagePrompt(userPrompt);
  }
  const data: ImageGenerationData = {
    prompt: upscaledPrompt?.prompt ?? userPrompt,
    negPrompt: upscaledPrompt?.negPrompt,
    scale,
    steps,
    seed,
    secondaryServer,
  };

  const { stream, fileName } = await callPromptToImage(data);

  return {
    stream,
    fileName,
    promptUsed: data,
  };
}

export async function callChat(params: ChatRequest) {
  try {
    const response = await axiosInstance.post('/chat', params, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return String(response.data);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(
        err.response?.statusText || 'Unknown error. Please try again.'
      );
    }
    throw new Error(JSON.stringify(err));
  }
}

export async function callGenerate(params: GenerateRequest) {
  try {
    const response = await axiosInstance.post('/generate', params, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return String(response.data);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(
        err.response?.statusText || 'Unknown error. Please try again.'
      );
    }
    throw new Error(JSON.stringify(err));
  }
}

export async function onlineCompletion(query: string) {
  const payload = {
    prompt: query,
  };

  try {
    const response = await axiosInstance.post('/perplexity', payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return String(response.data);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(
        err.response?.statusText || 'Unknown error. Please try again.'
      );
    }
    throw new Error('Unknown error. Please try again.');
  }
}
