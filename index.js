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

client.on("messageCreate", function (message) {
    if (message.author.bot) return;

    pendingChannels.push(message.channel);

    if (message.content.startsWith('!logMessage')) {
        if (process.getgid) {
            console.log('Current gid: ' + process.getgid());
        }
        message.reply('Fine');
    }

    if (message.content.startsWith('!help')) {
        message.reply('Use **!storyboard <prompt>** to have me make a short video with AI generated dialog and images.\nUse **!image <prompt>** to have me generate 1 image for you.\n\nBoth of these can take some time, I will say I am typing to let you know I\'m still working on it.\n\nWhen using **!image**, you can pass in the flags *--steps N --scale X --seed Z*, all as optional parameters (eg **!image --steps 30 --seed 12345 <prompt>**).\nDefault values:\n    seed: randomly generated, you can override\n    steps: 50\n    scale: 7.5\n\nI will return images made with **!image** prepended with the seed so you can re-use the phrase you used to create the image to fine-tune it.\n\n**!storyboard** will have some basic content moderation in place, but **!image** will try and draw *whatever you type*.');
    }

    // Check if the message starts with the !storyboard command
    if (message.content.startsWith('!storyboard')) {
        (async () => {
            try {
                await message.channel.sendTyping();

                const args = message.content.slice('!storyboard'.length).trim().split(/ +/);
                let promptWords = [];
                let dev = false

                // Parse the flags and their values
                for (let i = 0; i < args.length; i++) {
                    switch (args[i]) {
                        case '--dev':
                            dev = true;
                            break
                        default:
                            promptWords.push(args[i]);
                            break;
                    }
                }

                // Reconstruct the prompt without the flags
                const userPrompt = promptWords.join(' ');

                const apiCallPromise = callPromptToStoryboard(userPrompt, dev);
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

    if (message.content.startsWith('!image')) {
        (async () => {
            try {
                await message.channel.sendTyping();

                const args = message.content.slice('!image'.length).trim().split(/ +/);
                let promptWords = [];
                let seed = null;
                let scale = null;
                let steps = null;
                let gpt = false;
                let dev = false;
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
                        case '--gpt':
                            ++i;
                            gpt = true;
                            break;
                        case '--dev':
                            dev = true;
                            break
                        case '--local':
                            localDiffusion =  true;
                            break
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

                const apiCallPromise = generateImage(userPrompt, seed, scale, steps, localDiffusion, dev, gpt);
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
