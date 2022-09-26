import { ApplicationCommandRegistry, Command } from "@sapphire/framework";
import { fetch, FetchResultTypes } from "@sapphire/fetch";
import { CommandInteraction, MessageEmbed } from "discord.js";
import * as cheerio from "cheerio";
import fetchJobIcon from "../../utils/fetch-job-icon.js";
import { DREAM_MS_LOGO } from "../../lib/constants.js";
import { stripIndents } from "common-tags";

export class UserCommand extends Command {

    public constructor(context: Command.Context, options: Command.Options) {
        super(context, {
            ...options,
            name: "top",
            description: "Show the top Dream MS players, either server overall or only a particular class.",
            detailedDescription: stripIndents`
                **Name**: \`top\`
                **Syntax:** \`/top [class]\`
                
                **Example usage:**
                \`/top\`
                \`/top Aran\`
                
                **Description:**
                Retrieve the top 20 ranked players from the Dream MS rankings. All data is scraped from the Dream MS website (https://dream.ms/).
                All explorers are grouped together by class. This is by design, as that is how the DreamMS website groups characters.
                
                **Arguments:**
                \`[class]\`: *(optional)* The character class. Pick an option from the dropdown list. If left blank, bot will search for the overall top 20 players.
            `
        });
    }

    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand(builder =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addStringOption(option =>
                    option
                        .setName("job")
                        .setDescription("Select a job")
                        .setRequired(false)
                        .addChoices(
                            { name: "All jobs", value: "All" },
                            { name: "Warrior", value: "Warrior" },
                            { name: "Magician", value: "Magician" },
                            { name: "Bowman", value: "Bowman" },
                            { name: "Thief", value: "Thief" },
                            { name: "Pirate", value: "Pirate" },
                            { name: "Aran", value: "Aran" },
                            { name: "Dawn Warrior", value: "Dawn" },
                            { name: "Blaze Wizard", value: "Blaze" },
                            { name: "Wind Archer", value: "Wind" },
                            { name: "Night Walker", value: "Night" },
                            { name: "Thunder Breaker", value: "Thunder" },
                            { name: "Beginner", value: "Beginner" }
                        )
                )
        );
    }

    public override async chatInputRun(interaction: CommandInteraction) {

        interface CharacterInfo {
            rank: number;
            ign: string;
            level: number;
            job: string;
        }

        await interaction.deferReply();

        const category: string = interaction.options.getString("job") || "All";
        const cutoff: number = 20;

        const promises: Promise<any>[] = [];
        const pagesToFetch = getFetchUrls(cutoff, category);
        pagesToFetch.forEach(url => {
            promises.push(
                new Promise(async resolve => {
                    const html = await fetch(url, FetchResultTypes.Text);
                    const $ = cheerio.load(html);

                    const characters: CharacterInfo[] = [];
                    $(".details").each((_index, element) => {
                        const rank = Number($(element).find("span").text());
                        const ign = $(element).find(`a[href*='index.php?stats=']`).text();
                        const level = Number($(element).find("p:contains('Lv. ')").text().split(". ")[1]);
                        const job = (() => {
                            const text = $(element).find(".social p").contents().text();
                            return text.includes(" ") ? text.split("  ")[1] : text.trim();
                        })()
                        characters.push({ rank, ign, level, job });
                    })

                    resolve(characters);
                })
            );
        });

        const result = await Promise.all(promises).catch(_error => console.log("Fetch characters failed"));

        if (!result) {
            return interaction.followUp({
                content: `Unable to fetch data, try again later.`
            });
        }

        const charList: CharacterInfo[] = [].concat(...result).sort((a: CharacterInfo, b: CharacterInfo) => a.rank - b.rank);

        // remove duplicate entries
        for (let i = 0; i < charList.length; i++) {
            if (charList[i].rank === i) {
                charList.splice(i, 1);
                i--;
            }
        }

        const desc = charList.reduce(
            (prev: string, current: CharacterInfo, index: number) => {
                const { rank, ign, level, job } = current;
                const newLine = index % 5 === 0 ? "\n\n" : "\n";
                const jobIcon = fetchJobIcon(job);
                return `${prev}${newLine}\`${rank.toString().padStart(3, " ")}\` **LV. ${level}** ${jobIcon} [${ign}](https://dream.ms/index.php?stats=${ign}#speakers)`
                // return `${prev}${newLine}\`${rank.toString().padStart(3, " ")}\` ${numIcon(level)} ${jobIcon} [${ign}](https://dream.ms/index.php?stats=${ign}#speakers)`
            },
            `Job rankings for **[${category}](https://dream.ms/?class=${category})**\n`
        );

        const embed = new MessageEmbed()
            .setTitle("Dream MS Rankings")
            .setThumbnail(DREAM_MS_LOGO)
            .setColor("#a100ff")
            .setDescription(desc)
            .addFields([
                {
                    name: "\u200B",
                    value: "<:quest:915338502789533737> Tip: use **/rank <ign>** for character details!"
                }
            ])
            .setFooter({
                text: `Data scraped from the Dream MS rankings`,
                iconURL: `https://dream.ms/favicon.png`
            })
            .setTimestamp()
            .setThumbnail(DREAM_MS_LOGO)

        return interaction.followUp({
            content: null,
            embeds: [embed]
        })
    }
}

function getFetchUrls(cutoff, category) {
    const indexes: number[] = [];
    const lastIndex = Math.max(cutoff - 9, 0);
    indexes.push(lastIndex);

    if (lastIndex !== 0) {
        let nextIndex = Math.max(lastIndex - 9, 0);
        indexes.push(nextIndex);
        while (nextIndex > 0) {
            nextIndex -= 9;
            if (nextIndex <= 0) {
                break;
            }
            indexes.push(nextIndex);
        }
        if (!indexes.includes(0)) {
            indexes.push(0);
        }
    }

    const pages: string[] = [];
    indexes.forEach(number => pages.push(`https://dream.ms/?rank=${number}&class=${category}`));

    return pages;
}

/*
function numIcon(number) {
    if (typeof number !== "number") return;
    const icons = [
        "<:lv0:994440147892457612>",
        "<:lv1:994440398363693127>",
        "<:lv2:994440414893453415>",
        "<:lv3:994440534607282308>",
        "<:lv4:994440547580264569>",
        "<:lv5:994440557919211580>",
        "<:lv6:994440568824397924>",
        "<:lv7:994440578043486288>",
        "<:lv8:994440589397458964>",
        "<:lv9:994440637338374177>"
    ];
    const numString = number.toString().padStart(3, "0");
    // let result = `<:lvicon:994442994105200672>`;
    let result = "**LV. **";
    for (let i = 0; i < numString.length; i++) {
        const digit = numString[i];
        result += i === 0 && digit === "0" ? "<:lvx:994442261729382491>" : icons[digit];
    }
    return result;
}*/
