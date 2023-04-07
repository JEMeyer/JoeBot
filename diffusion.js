const axios = require('axios');
const { Readable } = require('stream');

// Function to convert buffer to readable stream
function bufferToStream(buffer) {
    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null);
    return readableStream;
}

async function generateImage(userPrompt) {
    const data = {
        prompt: userPrompt,
        scale: 7.5,
        steps: 50,
        seed: Math.floor(Math.random() * 1000)
    };

    const response = await axios.post('http://192.168.1.99:20020/generate', data, {
        headers: {
            'Content-Type': 'application/json',
        },
    });

    console.log(response);

    const secondResponse = await axios.get(`http://192.168.1.99:20020/download/${response.data.download_id}`, {
        responseType: 'arraybuffer'
    });

    const buffer = Buffer.from(secondResponse.data);
    const filename = secondResponse.headers['content-disposition'].split('filename=')[1].replace(/"/g, '');
    return {
        stream: bufferToStream(buffer),
        filename,
    };
}

module.exports = {
    generateImage
};