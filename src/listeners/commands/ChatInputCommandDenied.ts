import { container, Events, Listener } from "@sapphire/framework";
import type { TextChannel } from "discord.js";
import config from "../../config.json" assert { type: "json" };

export class UserEvent extends Listener {

    public constructor(context, options = {}) {
        super(context, {
            ...options,
            event: Events.ChatInputCommandDenied
        });
    }

    public override async run(error, { interaction }: { interaction: any }) {

        const runLocation = interaction.inGuild()
            ? `${interaction.member.guild.name} #${interaction.channel.name}`
            : "DM";

        const subcommand = interaction.options._subcommand || "";
        const parameters = subcommand ? interaction.options._hoistedOptions : interaction.options.data;
        const parsedParams = parameters.reduce((prev, { name, value }) => `${prev} ${name}:${value}`, "");

        const log = `[${runLocation}] ${interaction.user.tag}: /${interaction.commandName} ${subcommand}${parsedParams}`;

        container.logger.warn(` denied - ${log}`);

        const logChannel = <TextChannel | null>await container.client.channels.fetch(config.channels.logs);

        if (!logChannel) { // no logs channel configured
            return;
        }

        await logChannel.send({
            content: `*❌ ${log}*\n\n${error.message}`,
            allowedMentions: { users: [] }
        });

        if (Reflect.get(Object(error.context), "silent")) {
            return;
        }

        return interaction.reply({
            content: error.message,
            ephemeral: error.context?.ephemeral ?? true
        });
    }
}
