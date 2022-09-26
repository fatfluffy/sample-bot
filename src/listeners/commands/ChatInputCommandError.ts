import { ChatInputCommandErrorPayload, container, Events, Listener } from "@sapphire/framework";
import { codeBlock } from "@sapphire/utilities";
import { stripIndents } from "common-tags";
import config from "../../config.json" assert { type: "json" };

export class UserEvent extends Listener {

    constructor(context, options = {}) {
        super(context, {
            ...options,
            event: Events.ChatInputCommandError
        });
    }

    async run(error, { interaction }: ChatInputCommandErrorPayload) {

        container.logger.error(`Encountered error when running /${interaction.commandName}`);
        console.error(error);

        const errorMessage = stripIndents`
            Encountered an error running **/${interaction.commandName}**.
            Please screenshot and send this to <@${config.owner.id}> (${config.owner.name})!
            ${codeBlock("javascript", error)}
        `;

        return interaction.replied
            ? interaction.followUp({
                content: errorMessage
            })
            : interaction.reply({
                content: errorMessage,
                ephemeral: true
            });
    }
}
