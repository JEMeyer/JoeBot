import { App } from '@slack/bolt';
import { callChat, callGenerate, callPromptToStoryboard, generateImage } from './backend';
import { generateFilename, saveFile, streamToBuffer } from './utilities';
import axios from 'axios';
import { retrieveRelevantMessages } from './weaviate';

export const SlackBot = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

// Object to store user ID to name mapping
const usersStore: Record<string, string | undefined> = {};

// Function to load user ID to name mapping
export async function loadUserMapping() {
  try {
    // Call the users.list method to retrieve all users
    const result = await SlackBot.client.users.list();

    // Extract the members from the response
    const members = result.members ?? [];

    // Loop through each member and add their ID and name to the mapping
    for (const member of members) {
      if (!member.is_bot && member.profile && member.id) {
        usersStore[member.id] = member.profile.real_name;
      }
    }

    console.log('User ID to name mapping loaded:', usersStore);
  } catch (error) {
    console.error('Error loading user ID to name mapping:', error);
  }
}

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

const understand_context = "You are a helpful chatbot. You will be provided with a series of messages containing relevant information to help answer the user's question. Carefully review all the provided context before formulating a response.";
// const user_mapping = `Wnen you see an id that looks like U followed by 8 or 10 letters or numbers, that is an ID of a user. When responding, never use their IDs, instead convert it to their name using this map: ${usersStore}.`;
const bot_instruction = "Given all of the context and the actual query from the user, respond to the user in a concise way. Avoid being vague since it sounds like you're not confident - the length of your response can vary but don't ramble. If the user asks a complicated question you can give a more detailed answer. Only return text that would be spoken by you. Never include a U based ID in your response. Only return the message you'd send in a chat.";
const bot_personality = "Respond with the personality of someone who is eager to help and is witty and smart. You keep wondering about WWIII and Israel and Palestine though so sometime you go off track ranting about genocide.";

// Listen for messages that mention the bot
SlackBot.event('app_mention', async ({ event, logger, client, say }) => {
  try {
    let dots = 2;
    let increasing = true;
    const typingMessage = await say(":hourglass:");

    const intervalId = setInterval(async () => {
      const hourglass = ":hourglass: ".repeat(dots);
      await client.chat.update({
        channel: event.channel,
        ts: typingMessage.ts ?? '',
        text: hourglass
      });

      if (increasing) {
        dots++;
        if (dots === 5) {
          increasing = false;
          dots = 4;
        }
      } else {
        dots--;
        if (dots === 0) {
          increasing = true;
          dots = 1;
        }
      }
    }, 1000);

    // Get the text of the message, removing the bot mention
    const text = event.text.trim();

    // Retrieve the last 10 messages from the channel
    const history = await SlackBot.client.conversations.history({
      channel: event.channel,
      limit: 10,
    });

    const _lastMessages = history.messages ?? [];

    // Retrieve relevant messages from the Weaviate vector database
    const relevantMessages = await retrieveRelevantMessages(
      text,
      75
    );

    const system = `${understand_context}\n${bot_instruction}\n${bot_personality}\nRelevant Historical Context Messages:
    ${relevantMessages.map((msg) => `${usersStore[msg.user]} said "${msg.text}" in channel ${msg.channel}`).join('\n')}`;

    // Call the backend service with the Ollama model
    const response = await callGenerate({
      system,
      prompt: text,
      model: 'dolphin-mixtral:8x7b-v2.7-q6_K',
    });

    console.log(`User: ${text}\nBot: ${response}`);

    clearInterval(intervalId);
    await client.chat.update({
      channel: event.channel,
      ts: typingMessage.ts ?? '',
      text: response
    });
  }
  catch (error) {
    logger.error(error);
  }
});
