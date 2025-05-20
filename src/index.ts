import { Client, GatewayIntentBits } from 'discord.js';
import * as dotenv from 'dotenv';
import { interactionManager } from './interactions/interactionManager';
import { registerCommands } from './commands/registerCommands';
import './healthCheck'; // Import the health check server

dotenv.config();

// Validate only essential environment variables
const requiredEnvVars = ['DISCORD_TOKEN', 'DISCORD_APP_ID'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

if (!process.env.MANAGER_ROLE_ID) {
  console.warn('MANAGER_ROLE_ID not set in .env file. Use /setmanagerrole command to set it.');
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
