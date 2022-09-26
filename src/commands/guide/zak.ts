import { ApplicationCommandRegistry, Command } from "@sapphire/framework";
import { CommandInteraction, MessageAttachment } from "discord.js";
import { stripIndents } from "common-tags";

const source = "https://forum.dream.ms/attachments/1631730685184-png.4408/";

export class UserCommand extends Command {

    public constructor(context: Command.Context, options: Command.Options) {
        super(context, {
            ...options,
            name: "zak",
            description: "Zakum Prequest stage 1 guide.",
            detailedDescription: stripIndents`
                **Name**: \`/zak\`
                **Syntax:** \`/zak [hide]\`
                
                **Example usage:**
                \`/zak\`
                
                **Description:**
                Shows the Zakum prequest Stage 1 guide (pictured above).
                
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

        const file = new MessageAttachment("./assets/images/guides/zak_pre.png");
        const ephemeral = !!interaction.options.getBoolean("hide");

        return interaction.reply({
            content: `[Source](<${source}>)`,
            files: [file],
            ephemeral
        });
    }
}