import { ApplicationCommandRegistry, Command } from "@sapphire/framework";
import type { CommandInteraction } from "discord.js";
import * as expTable from "../../utils/exp-table.js";
import digitSeparator from "../../utils/digit-separator.js";
import { stripIndents } from "common-tags";

export class UserCommand extends Command {

    constructor(context: Command.Context, options: Command.Options) {
        super(context, {
            ...options,
            name: "exp",
            description: "Shows the exp needed at this level.",
            detailedDescription: stripIndents`
                **Name**: \`/exp\`
                **Syntax:** \`/exp <level>\`
                
                **Example usage:**
                \`/exp 250\`
                
                **Description:**
                Shows the amount of experience points needed at a certain level.
                
                **Arguments:**
                \`<level>\`: *(required)* The character level to calculate.
            `
        })
    }

    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand(builder =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addNumberOption(option =>
                    option
                        .setName("level")
                        .setDescription(`Enter a number between 1 and 299`)
                        .setMinValue(1)
                        .setMaxValue(299)
                        .setRequired(true)
                )
        );
    }

    public override async chatInputRun(interaction: CommandInteraction) {

        const level = interaction.options.getNumber("level")!;

        const low = Math.max(1, level - 6);
        const high = Math.min(299, level + 6);

        const source = "https://forum.dream.ms/threads/general-level-1-300-exp-table.3342/";

        let desc = `[Dream MS EXP Table](<${source}>)\n`;
        desc += "```  Lvl  |  EXP to next level  \n-------+---------------------\n";
        for (let i = low; i <= high; i++) {
            const expNeeded = expTable.toNextLevel(i);
            const header = i === level ? ">" : " ";
            desc += `${header} ${i.toString().padStart(3, " ")}  |  ${digitSeparator(expNeeded).padStart(17, " ")}  \n`
        }
        desc += "```";

        // const embed = new MessageEmbed()
        //     .setTitle("DreamMS EXP Table")
        //     .setURL(source)
        //     .setColor("#000000")
        //     .setDescription(desc);

        return interaction.reply({
            content: desc,
            // embeds: [embed]
        });
    }
};