import { ApplicationCommandRegistry, Command, container } from "@sapphire/framework";
import { Type } from "@sapphire/type";
import { codeBlock, isThenable } from "@sapphire/utilities";
import { inspect } from "util";
import config from "../../config.json" assert { type: "json" };
import type { CommandInteraction } from "discord.js";

export class UserCommand extends Command {

    public constructor(context: Command.Context, options) {
        super(context, {
            ...options,
            name: "eval",
            description: "[Admin command]",
            preconditions: ["OwnerOnly"],
            hidden: true
        });
    }

    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand(builder =>
                builder
                    .setName(this.name)
                    .setDescription(this.description)
                    .addStringOption(option =>
                        option
                            .setName("code")
                            .setDescription("JS")
                            .setRequired(true)
                    )
                    .addIntegerOption(option =>
                        option
                            .setName("depth")
                            .setDescription("Object nesting depth")
                            .setRequired(false)
                    )
                    .addBooleanOption(option =>
                        option
                            .setName("async")
                            .setDescription("Evaluate asynchronously")
                            .setRequired(false)
                    )
                    .addBooleanOption(option =>
                        option
                            .setName("hidden")
                            .setDescription("Show hidden properties")
                            .setRequired(false)
                    )
                    .addBooleanOption(option =>
                        option
                            .setName("public")
                            .setDescription("Show result (ephemeral by default)")
                            .setRequired(false)
                    )
            , { guildIds: config.guilds.admin }
        );
    }

    public override async chatInputRun(interaction: CommandInteraction, context) {

        const code = interaction.options.getString("code") ?? "";

        const { result, success, type } = await this.evaluate(interaction, context, code, {
            async: interaction.options.getBoolean("async") ?? false,
            depth: Number(interaction.options.getInteger("depth")) ?? 0,
            showHidden: interaction.options.getBoolean("hidden") ?? false
        });

        const output = success ? codeBlock("js", result) : `**ERROR**: ${codeBlock("bash", result)}`;

        const codeFooter = `**Code**: ${codeBlock("javascript", code)}`;
        const typeFooter = `**Type**: ${codeBlock("typescript", type)}`;

        if (output.length > 2000) {
            return interaction.reply({
                content: `Output was too long... sent the result as a file.\n\n${codeFooter}\n${typeFooter}`,
                files: [{ attachment: Buffer.from(output), name: "output.js" }],
                ephemeral: !interaction.options.getBoolean("public")
            });
        }

        return interaction.reply({
            content: `${output}\n${codeFooter}\n${typeFooter}`,
            ephemeral: !interaction.options.getBoolean("public")
        });
    }

    async evaluate(
        _interaction: CommandInteraction,
        _context,
        code: string,
        flags: { async: boolean; showHidden: boolean; depth: number }
    ) {
        if (code.startsWith('```') && code.endsWith('```')) {
            code = code.replace(/(^.*?\s)|(\n.*$)/g, '');
        }
        if (flags.async) code = `(async () => {\n${code}\n})();`;

        // @ts-ignore: pass these constants for use in eval
        const context = _context,
            client = container.client,
            interaction = _interaction;

        let success: boolean = true;
        let result;

        try {
            // eslint-disable-next-line no-eval
            result = eval(code);
        } catch (error) {
            if (error && error instanceof Error && error.stack) {
                console.error(error);
            }
            result = error;
            success = false;
        }

        const type = new Type(result).toString();
        if (isThenable(result)) result = await result;

        if (typeof result !== "string") {
            result = inspect(result, {
                depth: flags.depth,
                showHidden: flags.showHidden
            });
        }

        return { result, success, type };
    }
}