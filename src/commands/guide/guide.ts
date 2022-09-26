import { ApplicationCommandRegistry, Command } from "@sapphire/framework";
import { fetch, FetchResultTypes } from "@sapphire/fetch";
import type { Element } from "cheerio";
import * as cheerio from "cheerio";
import { CommandInteraction, MessageEmbed } from "discord.js";
import { findBestMatch } from "../../utils/string-similarity.js";
import { stripIndents } from "common-tags";

const url = `https://forum.dream.ms/threads/guide-directory.2708/#post-11682`;

interface Guide {
    name: string;
    link: string;
}

const guides: Guide[] = [];
const html = await fetch(url, FetchResultTypes.Text);
const $ = cheerio.load(html);
$("#js-post-11682")
    .find("li[data-xf-list-type] a")
    .each((_index, element: Element) => {
        const link = <string>$(element).attr("href");
        const name = <string>$(element).text();
        guides.push({ name, link });
    });

export class UserCommand extends Command {

    public constructor(context: Command.Context, options: Command.Options) {
        super(context, {
            ...options,
            name: "guide",
            description: "Search for a guide on the Dream MS guide directory.",
            detailedDescription: stripIndents`
                **Name**: \`/guide\`
                **Syntax:** \`/guide [search]\`
                
                **Example usage:**
                \`/guide cwk\`
                \`/guide\`
                \`/guide job advance\`
                
                **Description:**
                Search for a guide in the Dream MS Guide Directory (https://forum.dream.ms/threads/guide-directory.2708/#post-11682).
                
                **Arguments:**
                \`[search]\`: *(optional)* Search for a guide. If left blank, pulls up the entire guide directory instead.
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
                        .setName("search")
                        .setDescription("Search for a guide")
                        .setRequired(false)
                )
        );
    }

    public override async chatInputRun(interaction: CommandInteraction) {

        const search = interaction.options.getString("search");

        if (!search) {
            return interaction.reply({
                content: `Dream MS guide directory by Study:\n${url}`
            });
        }

        const guideNamesList = guides.map(({ name }) => {
            return name.toLowerCase().replace(/[^a-zA-z0-9 ]/g, ``);
        });

        let result = `Here are the closest matches for your search.\n\n`;
        const { ratings } = findBestMatch(search.toLowerCase(), guideNamesList);
        ratings.sort((a, b) => b.rating - a.rating)
            .some(({ index }, sortIndex) => {
                let guideName = `[${guides[index].name}](${guides[index].link})`;
                if (sortIndex === 0) guideName = `**${guideName}**`;
                result += `\`${(sortIndex + 1).toString().padStart(3, " ")} \` ${guideName}\n`
                return sortIndex >= 14;
            });
        result += `\n Check out the [complete list](${url}) if you can't find your guide listed here.`

        const embed = new MessageEmbed()
            .setTitle("Dream MS Guide Directory")
            .setColor(`#b600ff`)
            .setURL(url)
            .setDescription(result);

        return interaction.reply({ embeds: [embed] });
    }
}