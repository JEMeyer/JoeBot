require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const { callPromptToStoryboard } = require ('./backend.js');
const { sendTypingWhileAPICall } = require('./utilities.js');

let pendingChannels = [];

function removeFromPendingChannels(channel) {
    const index = pendingChannels.findIndex((i) => i.id === channel.id);
    pendingChannels.splice(index, 1);
}

// Function to handle shutdown
async function handleShutdown() {
    console.log('Bot shutting down...');
  
    // Send a message to the target channel
    if (pendingChannels.length) {
        for (let i = 0; i < pendingChannels.length; i++) {
            // Send a message to the last channel the bot interacted with
            await pendingChannels[i].send('I am dead. Rebooting beep boop.');
        }
    }
  
    // Destroy the client and exit the process
    client.destroy();
    process.exit();
}

// Handle the SIGINT and SIGTERM signals
process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

// Handle unhandled exceptions and promise rejections
process.on('uncaughtException', handleShutdown);
process.on('unhandledRejection', handleShutdown);

client.on("messageCreate", function(message) {
    if (message.author.bot) return;

    pendingChannels.push(message.channel);

    if (message.content.startsWith('!logMessage')) {
        if (process.getgid) {
            console.log('Current gid: ' + process.getgid());
         }
        message.reply('Fine');
        pendingChannels.filter(message.channel);
    }

    // Check if the message starts with the !storyboard command
    if (message.content.startsWith('!storyboard')) {
        (async () => {
            try {
                await message.channel.sendTyping();
                // const unique_id = message.id

                const userPrompt = message.content.replace('!storyboard', '').trim();

                const apiCallPromise = callPromptToStoryboard(userPrompt);
                const { stream, fileName }  = await sendTypingWhileAPICall(apiCallPromise, message);


                await message.reply({
                    files: [
                      {
                        name: fileName,
                        attachment: stream,
                      },
                    ],
                  });
                removeFromPendingChannels(message.channel)
            } catch (err) {
                console.error('Main  backend call error: ', err)
                message.reply('There was an error creating the storyboard, please try again.')
                removeFromPendingChannels(message.channel)
                return;
            }
        })()
    }
 });

client.login(process.env.BOT_TOKEN);
