import { App } from '@slack/bolt';
import { callChat, callPromptToStoryboard, generateImage } from './backend';
import { generateFilename, saveFile, streamToBuffer } from './utilities';
import axios from 'axios';
import { retrieveRelevantMessages } from './weaviate';
import { Message } from './ollama-types';

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
    const fileBuffer = await streamToBuffer(stream);

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

    const seed = Math.floor(Math.random() * 4294967295);
    const scale = 7.5;
    const steps = 50;
    const gpt = true;

    const { stream, fileName } = await generateImage(
      userPrompt,
      seed,
      scale,
      steps,
      gpt,
      false
    );
    const fileBuffer = await streamToBuffer(stream);

    await client.files.uploadV2({
      token: context.botToken,
      channel_id: command.channel_id,
      initial_comment: `Hey <@${command.user_id}>! Here's your image basd on '${userPrompt}' :yeet:.`,
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
SlackBot.command('/imagegenraw', async ({ command, ack, client, context }) => {
  // Acknowledge the command
  await ack(`Generating image with base prompt: ${command.text}`);

  // Process the command and send a response
  try {
    // Your custom logic for the slash command
    const userPrompt = command.text.trim();

    const seed = Math.floor(Math.random() * 4294967295);
    const scale = 7.5;
    const steps = 50;
    const gpt = false;

    const { stream, fileName } = await generateImage(
      userPrompt,
      seed,
      scale,
      steps,
      gpt,
      false
    );
    const fileBuffer = await streamToBuffer(stream);

    await client.files.uploadV2({
      token: context.botToken,
      channel_id: command.channel_id,
      initial_comment: `Hey <@${command.user_id}>! Here's your image basd on '${userPrompt}' :yeet:.`,
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

SlackBot.command(
  '/imagegenrawsecondary',
  async ({ command, ack, client, context }) => {
    // Acknowledge the command
    await ack(`Generating image with base prompt: ${command.text}`);

    // Process the command and send a response
    try {
      // Your custom logic for the slash command
      const userPrompt = command.text.trim();

      const seed = Math.floor(Math.random() * 4294967295);
      const scale = 7.5;
      const steps = 50;
      const gpt = false;

      const { stream, fileName } = await generateImage(
        userPrompt,
        seed,
        scale,
        steps,
        gpt,
        true
      );
      const fileBuffer = await streamToBuffer(stream);

      await client.files.uploadV2({
        token: context.botToken,
        channel_id: command.channel_id,
        initial_comment: `Hey <@${command.user_id}>! Here's openjoruney image basd on '${userPrompt}'  :tada:.`,
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
  }
);

SlackBot.command(
  '/imagegensecondary',
  async ({ command, ack, client, context }) => {
    // Acknowledge the command
    await ack(`Generating image with base prompt: ${command.text}`);

    // Process the command and send a response
    try {
      // Your custom logic for the slash command
      const userPrompt = command.text.trim();

      const seed = Math.floor(Math.random() * 4294967295);
      const scale = 7.5;
      const steps = 50;
      const gpt = true;

      const { stream, fileName } = await generateImage(
        userPrompt,
        seed,
        scale,
        steps,
        gpt,
        true
      );
      const fileBuffer = await streamToBuffer(stream);

      await client.files.uploadV2({
        token: context.botToken,
        channel_id: command.channel_id,
        initial_comment: `Hey <@${command.user_id}>! Here's your openjoruney image basd on '${userPrompt}'  :tada:.`,
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
  }
);

const targetChannelId = process.env.SLACK_IMAGE_BACKUP_CHANNEL_ID;

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

    if (!isBot) {
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

        fileName = generateFilename(fileName);

        // Download the file content
        if (fileUrl) {
          const response = await axios.get(fileUrl, {
            responseType: 'arraybuffer',
            headers: {
              Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
            },
          });

          const fileContent = response.data;

          // Save file to the family photos folder
          await saveFile(
            `${process.env.NAS_PATH}${process.env.FAM_PHOTOS_FOLDER_PATH}`,
            fileName,
            fileContent
          );
        }
      }
    }
  } catch (error) {
    console.error('Error processing file_shared event:', error);
  }
});

SlackBot.message(async ({ message, say }) => {
  try {
    const authTest = await SlackBot.client.auth.test();
    const botUserId = authTest.user_id;
    if ('text' in message && message.text != null) {
      const isBotMentioned = message.text.includes(`<@${botUserId}>`);

      if (isBotMentioned) {
        // Retrieve the last 10 messages from the channel
        const history = await SlackBot.client.conversations.history({
          channel: message.channel,
          limit: 10,
        });

        const lastMessages = history.messages ?? [];

        // Retrieve relevant messages from the Weaviate vector database
        const relevantMessages = await retrieveRelevantMessages(
          message.text,
          100
        );

        // Prompt model and combine the history messages and relevant messages
        const allMessages = [
          {
            role: 'system',
            content:
              'You are a helpful and funny assistant that responds to users in the style of scooby-doo.',
          },
          ...relevantMessages.map((msg) => ({
            role: 'assistant',
            content: `channel:${msg.channel}|user:${msg.user}|msg:${msg.text}`,
            metadata: { type: 'relevantDocuments' },
          })),
          ...lastMessages.map((msg) => ({
            role: 'assistant',
            content: `${msg.user}:${msg.text}`,
            metadata: { type: 'historyMessages' },
          })),
          {
            role: 'user',
            content: message.text,
          },
        ];

        // Call the backend service with the Ollama model
        const response = await callChat({
          messages: allMessages,
          model: 'yarn-llama2:13b-64k',
          options: { num_ctx: 65536 },
        });

        // Send the response as a reply
        await say(response);
      }
    }
  } catch (error) {
    console.error('Error processing message:', error);
  }
});
