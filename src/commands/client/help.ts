import { ApplicationCommandRegistry, Command, container } from "@sapphire/framework";
import { CommandInteraction, MessageEmbed } from "discord.js";
import config from "../../config.json" assert { type: "json" };
import { BOT_INVITE_ACTION_ROW, DREAM_MS_LOGO, HELP_MESSAGE } from "../../lib/constants.js";
import { stripIndents } from "common-tags";

export class UserCommand extends Command {

    constructor(context: Command.Context, options) {
        super(context, {
            ...options,
            name: "help",
            description: "Show more information about this bot.",
            detailedDescription: stripIndents`
                **Name**: \`help\`
                **Syntax:** \`/help [command]\`
                
                **Example usage:**
                \`/help\`
                \`/help rank\`
                
                **Description:**
                Shows more information about DreamBot.
                
                **Arguments:**
                \`[command]\`: *(optional)* Show a detailed description for any particular command.
            `
        })
    }

    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand(builder =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addStringOption(option =>
                    option
                        .setName("command")
                        .setDescription("Which command do you need help with?")
                        .setRequired(false)
                )
        );
    }

    public override async chatInputRun(interaction: CommandInteraction) {

        const help = interaction.options.getString("command");

        const commandNames: string[] = [];
        const applicationCommands = await container.client.application!.commands.fetch();

        applicationCommands
            .sort((a, b) => a.name.localeCompare(b.name)) // sort alphabetically
            .forEach(({ name }) => commandNames.push(name));

        const commandStore = container.client.stores.get("commands");
        if (help) {
            const desc = <string | undefined>commandStore.get(help)?.detailedDescription || stripIndents`
                \`${help}\` command doesn't exist!
                
                Try searching for one of the following:
                \`${commandNames.join("`, `")}\`
           `;
            return interaction.reply({ content: desc });
        }

        const embed = new MessageEmbed()
            .setColor("#edabff")
            .setTitle("DreamBot")
            .setDescription(stripIndents`
                ${HELP_MESSAGE}
                
                **Commands**
                \`/${commandNames.join("`, `/")}\`
            `)
            .setThumbnail(DREAM_MS_LOGO)

        return interaction.reply({
            content: config.links.invite,
            embeds: [embed],
            components: [BOT_INVITE_ACTION_ROW]
        });
    }
}