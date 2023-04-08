require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const { callPromptToStoryboard, generateImage } = require('./backend.js');
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

const commandPostfix = process.env.COMMAND_POSTFIX ?? ' ';

client.on("messageCreate", function (message) {
    if (message.author.bot) return;

    pendingChannels.push(message.channel);

    if (message.content === `!$logMessage${commandPostfix}`.trim()) {
        if (process.getgid) {
            console.log('Current gid: ' + process.getgid());
        }
        message.reply('Fine');
    }

    if (message.content === `!help${commandPostfix}`.trim()) {
        message.reply(`Use **!storyboard${commandPostfix} <prompt>** to have me make a short video with AI generated dialog and images.\nUse **!image${commandPostfix} <prompt>** to have me generate 1 image for you.\n\nI will say I am typing to let you know if I'm still working on your request.\n\nYou can use --local after the !image${commandPostfix} command to have a local Stable Diffusion model generate the image. This will take more time, but will remove content restrictions.\nWhen using **!image${commandPostfix}**, you can pass in several other flags, use !image${commandPostfix} -help for  more information.`);
    }

    // Check if the message starts with the !storyboard command
    if (message.content.startsWith(`!storyboard${commandPostfix}`)) {
        (async () => {
            try {
                await message.channel.sendTyping();

                const userPrompt = message.content.slice(`!storyboard${commandPostfix}`.length).trim();

                const apiCallPromise = callPromptToStoryboard(userPrompt);
                const { stream, fileName } = await sendTypingWhileAPICall(apiCallPromise, message);


                await message.reply({
                    files: [
                        {
                            name: fileName,
                            attachment: stream,
                        },
                    ],
                });
            } catch (err) {
                console.error('Main  backend call error: ', err)
                message.reply('There was an error creating the storyboard, please try again.')
                removeFromPendingChannels(message.channel)
                return;
            }
        })()
    }

    if (message.content.startsWith(`!image${commandPostfix}`)) {
        (async () => {
            try {
                await message.channel.sendTyping();

                const args = message.content.slice(`!image${commandPostfix}`.length).trim().split(/ +/);
                let promptWords = [];
                let seed = null;
                let scale = null;
                let steps = null;
                let gpt = true;
                let localDiffusion = false;

                // Parse the flags and their values
                for (let i = 0; i < args.length; i++) {
                    switch (args[i]) {
                        case '--seed':
                            seed = args[++i];
                            break;
                        case '--scale':
                            scale = args[++i];
                            break;
                        case '--steps':
                            steps = args[++i];
                            break;
                        case '--raw':
                            gpt = false;
                            break;
                        case '--local':
                            localDiffusion =  true;
                            break
                        case '-help':
                            message.reply(`**!image${commandPostfix}** has 5 flags you can (optionally) specify:\n    *--raw* will not pre-process your prompt through GPT to try and get more intense descriptions for the diffusion model. Default = false and will result in  more impressive images for smaller prompts\n    *--seed <integer>* will pass the seed to the diffusion model. If you have a complex prompt that you like, look at the first part of the image (XXXX_____restOfName.png), and pass in the XXXX number to use the same seed\n    *--scale <number>* determines the guidance scale. Values range from 1-30, with 1 being loosly tied to the text, and 30 is tightly tied to the text. Default is 7.5\n    *--steps <integer>* will determine how many iterations of diffusion the model goes through. Typically 30-100. Default 50\n    *--local* will have a local Stable Diffusion model generate the image. This will take more time, but will remove content restrictions`);
                            removeFromPendingChannels(message.channel);
                            return;
                        default:
                            promptWords.push(args[i]);
                            break;
                    }
                }

                // Reconstruct the prompt without the flags
                const userPrompt = promptWords.join(' ');

                // Default optional values
                seed = seed ?? Math.floor(Math.random() * 4294967295);
                scale = scale ?? 7.5;
                steps = steps ?? 50;

                const apiCallPromise = generateImage(userPrompt, seed, scale, steps, localDiffusion, gpt);
                const { stream, fileName } = await sendTypingWhileAPICall(apiCallPromise, message);


                await message.reply({
                    files: [
                        {
                            name: fileName,
                            attachment: stream,
                        },
                    ],
                });
            } catch (err) {
                console.error('Stable diffusion call error: ', err)
                message.reply('There was an error creating the image, please try again.')
                removeFromPendingChannels(message.channel)
                return;
            }
        })()
    }
    removeFromPendingChannels(message.channel)
});

client.login(process.env.BOT_TOKEN);
