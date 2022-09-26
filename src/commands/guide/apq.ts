import { ApplicationCommandRegistry, Command } from "@sapphire/framework";
import { CommandInteraction, MessageAttachment } from "discord.js";
import { stripIndents } from "common-tags";

const source = "https://bbb.hidden-street.net/party-quest/amorian-challenge/stage-2";

export class UserCommand extends Command {

    public constructor(context: Command.Context, options: Command.Options) {
        super(context, {
            ...options,
            name: "apq",
            description: "Amoria PQ stage 2 rope guide.",
            detailedDescription: stripIndents`
                **Name**: \`/apq\`
                **Syntax:** \`/apq [hide]\`
                
                **Description:**
                Shows the APQ Stage 2 rope guide.
                
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

        const file = new MessageAttachment("./assets/images/guides/apq_stage2.png");
        const ephemeral = !!interaction.options.getBoolean("hide");

        return interaction.reply({
            content: `[Source](<${source}>)`,
            files: [file],
            ephemeral
        });
    }
}