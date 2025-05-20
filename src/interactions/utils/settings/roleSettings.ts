import * as fs from 'fs';
import * as path from 'path';

// Function to find the project root (where package.json is located)
function findProjectRoot() {
  let currentDir = __dirname;
  while (currentDir !== path.parse(currentDir).root) {
    if (fs.existsSync(path.join(currentDir, 'package.json'))) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }
  // Fallback to a reasonable default if we can't find package.json
  console.warn("Couldn't find project root, using current directory's root");
  return path.parse(__dirname).root;
}

// Define the path to the settings file
const PROJECT_ROOT = findProjectRoot();
const CONFIG_DIR = path.join(PROJECT_ROOT, 'config');
const SETTINGS_FILE = path.join(CONFIG_DIR, 'settings.json');

// Type for our settings
interface BotSettings {
  managerRoleId: string | null;
}

// Default settings
const defaultSettings: BotSettings = {
  managerRoleId: process.env.MANAGER_ROLE_ID || null,
};

// In-memory cache of settings
let settings: BotSettings = defaultSettings;

// Ensure config directory exists
function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

// Load settings from file or create default
function loadSettings(): BotSettings {
  try {
    ensureConfigDir();
    
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
      const loadedSettings = JSON.parse(data) as BotSettings;
      console.log('Settings loaded from file');
      return loadedSettings;
    } else {
      // Initialize with environment variable or null
      saveSettings(defaultSettings);
      return defaultSettings;
    }
  } catch (error) {
    console.error('Error loading settings:', error);
    return defaultSettings;
  }
}

// Save settings to file
function saveSettings(newSettings: BotSettings): void {
  try {
    ensureConfigDir();
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(newSettings, null, 2), 'utf8');
    console.log('Settings saved to file');
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

// Initialize settings when module loads
settings = loadSettings();

export function getManagerRoleId(): string | null {
  return settings.managerRoleId;
}

export function setManagerRoleId(roleId: string): void {
  settings.managerRoleId = roleId;
  saveSettings(settings);
  console.log(`Manager role ID updated to: ${roleId}`);
}