import { App } from '@slack/bolt';
import { callPromptToStoryboard, generateImage } from './backend';
import { createNewFilenameWithTimestamp, streamToBuffer } from './utilities';
import NextcloudClient from 'nextcloud-link';
import { ContentType } from 'webdav-client';

export const Nextcloud = new NextcloudClient({
    "url": process.env.NEXTCLOUD_SERVER ?? '',
    "password": process.env.NEXTCLOUD_PASSWORD ?? '',
    "username": process.env.NEXTCLOUD_USER ?? '',
});

export const SlackBot = new App({
    token: process.env.SLACK_BOT_TOKEN,
    appToken: process.env.SLACK_APP_TOKEN,
    socketMode: true,
});

// Listen for slash commands and handle them
SlackBot.command('/storyboard', async ({ command, ack, client, context }) => {
    // Acknowledge the command
    await ack(`Generating storyboard with base prompt: ${command.text}`);

    // Process the command and send a response
    try {
        // Your custom logic for the slash command
        const userPrompt = command.text.trim();

        const { stream, fileName } = await callPromptToStoryboard(userPrompt);
        const fileBuffer = await streamToBuffer(stream)

        await client.files.uploadV2({
            token: context.botToken,
            channel_id: command.channel_id,
            initial_comment: `Hey <@${command.user_id}>! Here's your storyboard :yeet:. Prompt used: ${userPrompt}`,
            file: fileBuffer,
            filename: fileName,
        });
    } catch (error) {
        console.error(error);
        await client.chat.postMessage({
            token: context.botToken,
            channel: command.channel_id,
            text: 'An error occurred while processing your command.',
        });
    }
});

// Listen for slash commands and handle them
SlackBot.command('/imagegen', async ({ command, ack, client, context }) => {
    // Acknowledge the command
    await ack(`Generating image with base prompt: ${command.text}`);

    // Process the command and send a response
    try {
        // Your custom logic for the slash command
        const userPrompt = command.text.trim();

        let seed = Math.floor(Math.random() * 4294967295);
        let scale = 7.5;
        let steps = 50;
        let gpt = true;
        let localDiffusion = false;

        const { stream, fileName } = await generateImage(
            userPrompt,
            seed,
            scale,
            steps,
            localDiffusion,
            gpt
        );
        const fileBuffer = await streamToBuffer(stream)

        await client.files.uploadV2({
            token: context.botToken,
            channel_id: command.channel_id,
            initial_comment: `Hey <@${command.user_id}>! Here's your image :wow_fb:. Prompt used: "${command.text}"`,
            file: fileBuffer,
            filename: fileName,
        });
    } catch (error) {
        console.error(error);
        await client.chat.postMessage({
            token: context.botToken,
            channel: command.channel_id,
            text: 'An error occurred while processing your command.',
        });
    }
});

async function uploadFileToNextcloud(folderPath: string, fileName: string, fileContent: ContentType) {
    try {
        await Nextcloud.put(`${folderPath}/${fileName}`, fileContent);
        console.log(`File ${fileName} uploaded to Nextcloud successfully.`);
    } catch (error) {
        console.error('Error uploading file to Nextcloud:', error);
    }
}


const targetChannelId = process.env.SLACK_IMAGE_BACKUP_CHANNEL_ID;
const nextcloudFolderPath = process.env.NEXTCLOUD_SHARED_FOLDER;

SlackBot.event('file_shared', async ({ event, client }) => {
    try {
        // Check if the file was shared in the target channel
        if (event.channel_id !== targetChannelId) {
            return;
        }

        // Check if the user who uploaded the file is a bot
        const userResult = await client.users.info({
            token: process.env.SLACK_BOT_TOKEN,
            user: event.user_id,
        });

        const isBot = userResult.user?.is_bot;

        if (!isBot && nextcloudFolderPath) {
            // Fetch file details
            const result = await client.files.info({
                token: process.env.SLACK_BOT_TOKEN,
                file: event.file_id,
            });

            const file = result.file;
            const isImage = file?.mimetype?.startsWith('image/');


            // Upload the image to Nextcloud
            if (isImage) {
                const fileUrl = file?.url_private;
                let fileName = file?.name;

                if (!fileName) {
                    return;
                }

                fileName = createNewFilenameWithTimestamp(fileName);

                // Download the file content
                const axios = require('axios');
                const response = await axios.get(fileUrl, {
                    responseType: 'arraybuffer',
                    headers: {
                        'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`,
                    },
                });

                const fileContent = response.data;

                // Upload the file to Nextcloud
                await uploadFileToNextcloud(nextcloudFolderPath, fileName, fileContent);
            }
        }
    } catch (error) {
        console.error('Error processing file_shared event:', error);
    }
});

