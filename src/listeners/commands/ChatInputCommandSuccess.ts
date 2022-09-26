import { container, Events, Listener } from "@sapphire/framework";
import config from "../../config.json" assert { type: "json" };
import type { TextChannel } from "discord.js";

export class UserEvent extends Listener {

    constructor(context, options = {}) {
        super(context, {
            ...options,
            event: Events.ChatInputCommandSuccess
        });
    }

    async run({ interaction }: { interaction: any }) {

        const runLocation = interaction.inGuild()
            ? `${interaction.member.guild.name} #${interaction.channel.name}`
            : "DM";

        const subcommand = interaction.options._subcommand;
        const parameters = subcommand ? interaction.options._hoistedOptions : interaction.options.data;
        const parsedParams: string = parameters.reduce((prev, { name, value }) => `${prev} ${name}:${value}`, "");

        const commandName = subcommand ? `${interaction.commandName} ${subcommand}` : interaction.commandName;

        const log = `[${runLocation}] ${interaction.user.tag}: /${commandName}${parsedParams}`;

        container.logger.info(`success - ${log}`);

        const logChannel = <TextChannel | null>await container.client.channels.fetch(config.channels.logs);

        if (!logChannel) { // no logs channel configured
            return;
        }

        return logChannel.send({
            content: log,
            allowedMentions: { users: [] }
        });
    }

}
