import { ApplicationCommandRegistry, Command } from "@sapphire/framework";
import { CommandInteraction, MessageEmbed } from "discord.js";
import { stripIndents } from "common-tags";
import digitSeparator from "../../utils/digit-separator.js";

const MAX_ROLL_VALUE = 1_000_000;
const MAX_ROLL_COUNT = 100;

export class UserCommand extends Command {

    public constructor(context: Command.Context, options: Command.Options) {
        super(context, {
            ...options,
            name: "roll",
            description: "Roll a random number",
            detailedDescription: stripIndents`
                **Name**: \`roll\`
                **Syntax:** \`/roll [max] [count]\`
                
                **Example usage:**
                \`/roll\`
                \`/roll 100000 10\`
                
                **Description:**
                Roll a random number between 1 and a given max number.
                The default max is 100, highest possible is ${digitSeparator(MAX_ROLL_VALUE)}.
                
                **Arguments:**
                \`[max]\`: *(optional)* The upper limit (between 2 and ${digitSeparator(MAX_ROLL_VALUE)}). Default is 100.
                \`[count]\`: *(optional)* Choose the number of times to roll (between 1 and 100). Default is 1.
            `
        });
    }

    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand(builder =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addIntegerOption(option =>
                    option
                        .setName("max")
                        .setDescription(`Roll a random number between 1 and this value. Default is 100, maximum is ${digitSeparator(MAX_ROLL_VALUE)}.`)
                        .setRequired(false)
                        .setMinValue(2)
                        .setMaxValue(MAX_ROLL_VALUE)
                )
                .addIntegerOption(option =>
                    option
                        .setName("count")
                        .setDescription(`How many times do you want to roll this dice? Default is 1 time, maximum is ${digitSeparator(MAX_ROLL_COUNT)}.`)
                        .setRequired(false)
                        .setMinValue(1)
                        .setMaxValue(MAX_ROLL_COUNT)
                )
        );
    }


    public override async chatInputRun(interaction: CommandInteraction) {
        const roll = (min = 1, max = 100) => Math.floor(Math.random() * max) + min;

        const max: number = interaction.options.getInteger("max") || 100;
        const count: number = interaction.options.getInteger("count") || 1;

        if (max === MAX_ROLL_VALUE && count === MAX_ROLL_COUNT) {
            return interaction.reply({
                content: `<@${interaction.user.id}> bruh are you ok?`
            });
        }

        const rolls: number[] = [];
        for (let i = 0; i < count; i++) {
            const result = roll(1, max);
            rolls.push(result);
        }

        const embed = new MessageEmbed()
            .setColor("RANDOM")
            .setThumbnail("https://cdn.discordapp.com/attachments/979941646487650314/1009072528083398746/dice.png")
            .setDescription(stripIndents`
                **Rolls**
            
                ${rolls.join(", ")}
            `)

        return interaction.reply({
            content: `<@${interaction.user.id}> rolled a **${max}**-sided die${count > 1 ? ` **${count}** times.` : "."}`,
            embeds: [embed]
        });
    }
}