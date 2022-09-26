import { container, Events, Listener } from "@sapphire/framework";

export class UserEvent extends Listener {

    constructor(context, options = {}) {
        super(context, {
            ...options,
            event: Events.ChatInputCommandRun
        });
    }

    async run(interaction) {
        const runLocation = interaction.inGuild()
            ? `${interaction.member.guild.name} #${interaction.channel.name}`
            : "DM";

        const log = `[${runLocation}] ${interaction.user.tag}: /${interaction.commandName}`;

        container.logger.info(`    run - ${log}`);
    }
}
