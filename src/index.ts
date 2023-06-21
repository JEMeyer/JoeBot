import dotenv from 'dotenv';
dotenv.config();
import { DiscordClient } from './discord-bot';
import { Nextcloud, SlackBot } from './slack-bot';

try {
DiscordClient.login(process.env.BOT_TOKEN);
console.log('⚡️ DiscordClient is running!');

(async () => {
  // Start your app
  await SlackBot.start();
  console.log('⚡️ Slackbot is running!');
  while (true) {
    if (await Nextcloud.checkConnectivity()) {
      console.log('⚡️ Nextcloud Client is running!')
      return;
    }
  
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
})();
} catch (e) {
  console.log(e);
  throw e;
}
