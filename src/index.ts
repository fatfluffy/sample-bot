import { SapphireClient } from "@sapphire/framework";
import "./lib/setup.js";
import config from "./config.json" assert { type: "json" };

const client = new SapphireClient({
    intents: [
        'GUILDS',
        'GUILD_MEMBERS',
        'GUILD_BANS',
        'GUILD_EMOJIS_AND_STICKERS',
        'GUILD_INTEGRATIONS',
        'GUILD_WEBHOOKS',
        'GUILD_INVITES',
        'GUILD_VOICE_STATES',
        'GUILD_PRESENCES',
        'GUILD_MESSAGES',
        'GUILD_MESSAGE_REACTIONS',
        'GUILD_MESSAGE_TYPING',
        'DIRECT_MESSAGES',
        'DIRECT_MESSAGE_REACTIONS',
        'DIRECT_MESSAGE_TYPING',
        'GUILD_SCHEDULED_EVENTS'
    ],
    partials: [
        'USER',
        'CHANNEL',
        'GUILD_MEMBER',
        'MESSAGE',
        'REACTION',
        'GUILD_SCHEDULED_EVENT'
    ],
    defaultCooldown: {
        delay: 3000,
        filteredUsers: [config.owner.id]
    }
});

await client.login(<string>process.env.DISCORD_BOT_TOKEN);

// run or eval this to clear the command registry
// void client.application?.commands.set([]); client.guilds.cache.forEach(guild => guild.commands.set([]));