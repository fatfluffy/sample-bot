import { container, Events, Listener, Piece, Precondition } from "@sapphire/framework";
import { Guild, MessageEmbed, TextChannel } from "discord.js";
import config from "../../config.json" assert { type: "json" };
import { BOT_INVITE_ACTION_ROW, DREAM_MS_LOGO, HELP_MESSAGE } from "../../lib/constants.js";

export class UserEvent extends Listener {

    public constructor(context: Piece.Context, options: Precondition.Options = {}) {
        super(context, {
            ...options,
            event: Events.GuildCreate
        });
    }

    public override async run(guild: Guild) {
        const logChannel = <TextChannel>await container.client.channels.fetch(config.channels.logs);
        const log = `Added to new guild: ${guild.name} (${guild.id})`;

        container.logger.info(log);
        await logChannel.send(log);

        const embed = new MessageEmbed()
            .setColor("#edabff")
            .setTitle("DreamBot")
            .setDescription(HELP_MESSAGE)
            .setFooter({
                text: `Added to ${guild.name} (id: ${guild.id})`,
                iconURL: `https://dream.ms/favicon.png`
            })
            .setTimestamp()
            .setThumbnail(DREAM_MS_LOGO);

        return guild.systemChannel?.send({
            embeds: [embed],
            components: [BOT_INVITE_ACTION_ROW]
        });
    }

}