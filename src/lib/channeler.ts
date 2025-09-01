import { ChannelType, Guild } from "discord.js";
import { SessionInfo } from "./scraper";

/**
 * Creates forum channels in the specified guild for each session, under the given category.
 *
 * This function checks if a channel with the same normalized name and type already exists,
 * and will not create a duplicate if found.
 *
 * @param guild - The Discord guild where channels will be created.
 * @param sessions - Array of session info objects to create channels for.
 * @param CATEGORY_ID - The ID of the category under which to create the channels.
 */
export async function createChannelsFromSessions(guild: Guild, sessions: SessionInfo[], CATEGORY_ID: string) {
    sessions.forEach(async (session) => {
        const existing = guild.channels.cache.find(
            channel => normalize(channel.name) === normalize(session.title) && channel.type === ChannelType.GuildForum
        );
        if (existing) {
            console.info('Not creating channel. Channel already exists:', existing.name);
            return;
        }

        const channel = await guild.channels.create({
            name: session.title,
            type: ChannelType.GuildForum,
            parent: CATEGORY_ID,
            topic: session.date
        });

        console.info('Created channel:', channel.name);
    });
}

/**
 * Normalizes a string by lowercasing and removing spaces and hyphens.
 * Used for comparing channel names in a case- and separator-insensitive way.
 *
 * @param str - The string to normalize.
 * @returns The normalized string.
 *
 * @example
 * normalize('Review-of Randall’s Aristotle'); // 'reviewofrandall’saristotle'
 */
export function normalize(str: string) {
    return str.toLowerCase().replace(/[-\s]/g, '');
}
