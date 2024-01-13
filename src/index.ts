import dotenv from 'dotenv';
dotenv.config();
import { DiscordClient } from './discord-bot';
import { SlackBot } from './slack-bot';

try {
DiscordClient.login(process.env.BOT_TOKEN);
console.log('⚡️ DiscordClient is running!');

(async () => {
  // Start your app
  await SlackBot.start();
  console.log('⚡️ Slackbot is running!');
})();
} catch (e) {
  console.log(e);
  throw e;
}
