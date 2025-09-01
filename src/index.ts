import { Client, GatewayIntentBits} from 'discord.js';
import 'dotenv/config';
import { scrapeSessions } from './lib/scraper';
import { createChannelsFromSessions } from './lib/channeler';

runBot();

async function runBot() {
    console.info('Running bot...');

    const BOT_TOKEN = process.env.DISCORD_TOKEN;
    const SERVER_ID = process.env.DISCORD_SERVER_ID;
    const CATEGORY_ID = process.env.DISCORD_CATEGORY_ID;

    if (!BOT_TOKEN || !SERVER_ID || !CATEGORY_ID) {
        throw new Error('Missing required environment variables.');
    }

    // Default to 1 hour if not set
    const SCRAPE_INTERVAL = process.env.SCRAPE_INTERVAL ? parseInt(process.env.SCRAPE_INTERVAL) : 3600000;

    try {
        // Setup Discord client or bail
        const discordClient = new Client(
            { 
                intents: [
                    GatewayIntentBits.Guilds
                ] 
            }
        );

        await discordClient.login(BOT_TOKEN);
        console.info('Logged in as:', discordClient.user?.tag);
        
        const guild = await discordClient.guilds.fetch(SERVER_ID);
        if (!guild) {
            throw new Error('Guild not found.');
        }

        // Get the Server Channels for the first time on startup. 
        // This populates the cache.
        await guild.channels.fetch();
        console.info('Fetched server channels.');

        async function run() {
            const sessions = await scrapeSessions();
            if (sessions.length === 0) {
                throw new Error('No sessions found.');
            }
            console.info('Found sessions:', sessions);

            await createChannelsFromSessions(guild, sessions, CATEGORY_ID!);
        }

        // Process sessions and channels once on startup, then operate off a configurable timer.
        await run();
        setInterval(async () => {
            await run();
        }, SCRAPE_INTERVAL);

    } catch (error) {
        console.error('Error occurred while running bot:', error);
    }
}
