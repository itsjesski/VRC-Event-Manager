import { Client, GatewayIntentBits, Events } from 'discord.js';
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

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Signup Bot is online! Logged in as ${readyClient.user.tag}`);
  
  // Register commands after the bot is ready
  try {
    await registerCommands();
    console.log('Successfully registered commands');
  } catch (error) {
    console.error('Failed to register commands:', error);
  }
});

// Handle guild join events to register commands for new servers
client.on(Events.GuildCreate, async (guild) => {
  console.log(`Joined new guild: ${guild.name}`);
  try {
    // Optional: Register commands specifically for this guild
    // await registerCommandsForGuild(guild.id);
  } catch (error) {
    console.error(`Failed to register commands for guild ${guild.name}:`, error);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  await interactionManager(interaction);
});

// Log in the bot without registering commands first
client.login(process.env.DISCORD_TOKEN).catch((error) => {
  console.error('Failed to log in:', error);
});