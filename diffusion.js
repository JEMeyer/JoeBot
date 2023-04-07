const {callPromptToImagePrompt, callPromptToImage} = require('./backend');
const { bufferToStream } = require('./utilities.js');


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
    generateImage
};