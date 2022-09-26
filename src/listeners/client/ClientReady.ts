import { Events, Listener, Piece, Precondition, SapphireClient } from "@sapphire/framework";
import { stripIndents } from "common-tags";

type UserActivity = {
    type: "LISTENING" | "PLAYING" | "STREAMING" | "WATCHING";
    name: string;
}

const activities: UserActivity[] = [
    { type: "PLAYING", name: "Dream MS" },
    { type: "STREAMING", name: "Dream MS" },
    { type: "STREAMING", name: "/help" },
    { type: "WATCHING", name: "/help" },
    { type: "WATCHING", name: "all of you" },
    { type: "PLAYING", name: "/cs" },
    { type: "PLAYING", name: "/rank" },
    { type: "LISTENING", name: "/help" }
];

export class UserEvent extends Listener {

    public constructor(context: Piece.Context, options: Precondition.Options) {
        super(context, {
            ...options,
            event: Events.ClientReady
        });
    }

    public override async run(client: SapphireClient) {

        const timestamp = new Date().toLocaleString("en-GB", { timeZone: 'Asia/Singapore' });
        let guilds = ``;
        client.guilds.cache.forEach((guild, guildId) => {
            guilds += `[${guildId}] ${guild.name}\n`;
        });

        console.log(stripIndents`
            --------------------------------------------
            
            [${timestamp}] Bot is ready!
            
            Currently active in the following servers:
            ${guilds}
            --------------------------------------------
        `);

        setInterval(() => {
            const random = Math.floor(Math.random() * activities.length)
            const { type, name }: UserActivity = activities[random];
            client.user!.setActivity(name, { type });
        }, 30000);

    }

}