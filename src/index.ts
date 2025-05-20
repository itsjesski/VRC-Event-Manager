import { Client, GatewayIntentBits } from 'discord.js';
import * as dotenv from 'dotenv';
import { interactionManager } from './interactions/interactionManager';
import { registerCommands } from './commands/registerCommands';
import './healthCheck'; // Import the health check server

dotenv.config();

// Validate environment variables
const requiredEnvVars = ['DISCORD_TOKEN', 'DISCORD_APP_ID', 'MANAGER_ROLE_ID'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}


const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

client.once('ready', () => {
  console.log('Signup Bot is online!');
});

client.on('interactionCreate', async (interaction) => {
  await interactionManager(interaction);
});

// Register commands before logging in the bot
registerCommands()
  .then(() => {
    client.login(process.env.DISCORD_TOKEN);
  })
  .catch((error) => {
    console.error('Failed to register commands:', error);
  });
