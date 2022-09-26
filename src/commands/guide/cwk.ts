import { ApplicationCommandRegistry, Command } from "@sapphire/framework";
import { CommandInteraction, MessageAttachment } from "discord.js";
import { stripIndents } from "common-tags";

const source = "https://forum.dream.ms/threads/general-crimsonwood-keep-party-quest-cwkpq.3923/";

export class UserCommand extends Command {

    public constructor(context: Command.Context, options: Command.Options) {
        super(context, {
            ...options,
            name: "cwk",
            description: "Box splitting guide for CWKPQ bonus.",
            detailedDescription: stripIndents`
                **Name**: \`/cwk\`
                **Syntax:** \`/cwk [hide]\`
                
                **Description:**
                Shows the CWKPQ box splitting guide.
                
                **Arguments:**
                \`[hide]\`: *(optional)* Hide this command usage from others.
            `
        })
    }

    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand(builder =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addBooleanOption(option =>
                    option
                        .setName("hide")
                        .setDescription(`Hide this image from others?`)
                        .setRequired(false)
                )
        );
    }

    public override async chatInputRun(interaction: CommandInteraction) {

        const file = new MessageAttachment("./assets/images/guides/cwk_bonus.png");
        const ephemeral = !!interaction.options.getBoolean("hide");

        return interaction.reply({
            content: `[Source](<${source}>)`,
            files: [file],
            ephemeral
        });
    }
}