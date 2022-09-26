import { ApplicationCommandRegistry, Command, container } from "@sapphire/framework";
import { fetch, FetchResultTypes } from "@sapphire/fetch";
import { CommandInteraction, MessageAttachment, MessageEmbed } from "discord.js";
import { stripIndents } from "common-tags";
import * as cheerio from "cheerio";
import { createCanvas, GlobalFonts, Image, loadImage } from "@napi-rs/canvas";
import * as fs from "node:fs";

import digitSeparator from "../../utils/digit-separator.js";
import fetchJobIcon from "../../utils/fetch-job-icon.js";
import * as expTable from "../../utils/exp-table.js";
import { BOT_INVITE_ACTION_ROW, DREAM_MS_LOGO } from "../../lib/constants.js";

// Initialise backgrounds
GlobalFonts.registerFromPath("./assets/fonts/Maplestory.ttf", "Maplestory Light");

const bgs: Image[] = [];
fs.readdirSync("./assets/images/backgrounds").forEach(async img => {
    const bg = await loadImage(`./assets/images/backgrounds/${img}`);
    bgs.push(bg);
});

//-------------- User debug settings --------------
const RANK_SETTINGS = {
    PROGRESS_BAR_LENGTH: 15, // seems about the right length for mobile display
}

//-------------- ------------------- --------------

interface CharacterInfo {
    rank: string | number;
    ign: string;
    avatar: string;
    url: string;
    job: string;
    level: string;
    exp: string;
    fame: string;
    guild: string;
    alliance: string;
    partner: string;
    family: string;
    dpm: string;
    emblem?: string;
}

interface FetchCharacterResult {
    success: boolean;
    info: CharacterInfo | null;
}

// Actual command
export class UserCommand extends Command {

    public constructor(context: Command.Context, options: Command.Options) {
        super(context, {
            ...options,
            name: "rank",
            description: "Look up a character on the Dream MS rankings.",
            detailedDescription: stripIndents`
                **Name**: \`rank\`
                **Syntax:** \`/rank <ign> [face] [pose]\`
                
                **Example usage:**
                \`/rank capoo\`
                \`/rank capoo f2\`
                \`/rank dream f5 fly\`
                
                **Description:**
                Check a player's details from the Dream MS rankings.
                Search ign is not case-sensitive.
                All data is scraped from the Dream MS website (https://dream.ms/).
                
                **Arguments:**
                \`<ign>\`: *(required)* Character IGN. Must be 4-12 letters long.
                \`[face]\`: *(optional)* Facial expression (F1-F7)
                \`[pose]\`: *(optional)* Character pose (stand, swim, fly, etc). Defaults to jump.
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
                        .setName("ign")
                        .setDescription("The character IGN you want to look up")
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName("expression")
                        .setDescription("Character facial expression (F1-F7)")
                        .addChoices(
                            { name: "F1", value: ":hit" },
                            { name: "F2", value: ":smile" },
                            { name: "F3", value: ":troubled" },
                            { name: "F4", value: ":cry" },
                            { name: "F5", value: ":angry" },
                            { name: "F6", value: ":bewildered" },
                            { name: "F7", value: ":stunned" }
                        )
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option
                        .setName("pose")
                        .setDescription("Character pose (sit, stand, jump, fly, crouch)")
                        .addChoices(
                            { name: "Stand (1-handed)", value: "stand1" },
                            { name: "Stand (2-handed)", value: "stand2" },
                            { name: "Sit", value: "sit" },
                            { name: "Jump", value: "jump" },
                            { name: "Fly", value: "fly" },
                            { name: "Crouch", value: "prone" },
                            { name: "Hit", value: "heal" },
                        )
                        .setRequired(false)
                )
        );
    }

    public override async chatInputRun(interaction: CommandInteraction) {

        await interaction.deferReply();

        const ign = interaction.options.getString("ign");
        const expression = interaction.options.getString("expression") || "";
        const pose = interaction.options.getString("pose") || "jump";

        const { success, info }: { success: boolean; info: any } = await UserCommand.fetchCharacter(ign);
        if (!success) {
            return interaction.followUp({
                embeds: [
                    new MessageEmbed()
                        .setColor("RED")
                        .setTitle("Invalid character")
                        .setDescription(`❌ \`${ign}\` couldn't be found on the Dream MS rankings!`)
                ],
                content: null
            })
        }

        await interaction.followUp(`Found character **${info.ign}**! Fetching data...`);

        const stillAvatar = info.avatar.replace(/%2C\/jump/g, `${expression}/${pose}`);
        const animatedAvatar = info.avatar.replace(/%2C\/jump/g, "%2C/walk1").replace(/latest\/character/g, "latest/character/animated") + ".gif"; // .gif is needed for embed to render animation

        // const stillAvatar = info.avatar.replace(/%2C\/stand1\/animated/g, `${expression}/${pose}`);
        // https://api.dream.ms/api/gms/latest/character/animated/2000/20005,45157,0/walk1
        // https://api.dream.ms/api/gms/latest/character/2003/1072153%2C0%2C1053640%2C1012057%2C1022048%2C1005729%2C1703062%2C1032024%2C1082102%2C1102172%2C1092064%2C41406%2C21638%2C/jump/&renderMode=Centered&resize=1
        //https://maplestory.io/api/character/{"itemId":2000,"version":"231"},{"itemId":12000,"version":"231"},{"itemId":21542,"animationName":"cry","version":"231"},{"itemId":37762,"version":"231"}/stand1/0?showears=false&showLefEars=false&showHighLefEars=undefined&resize=1&name=&flipX=false&bgColor=0,0,0,0

        const rankEmbed = UserCommand.createCharacterEmbed(info).setImage(animatedAvatar);

        const files: MessageAttachment[] = [];
        let content: string | null = null;

        //-------------------------------------------------------------------------------
        // Comment out this part to skip canvas image - improves performance by a lot
        const { status, attachment } = await UserCommand.createImage(stillAvatar, info);
        if (attachment) {
            files.push(attachment);
        }
        if (!status) {
            content = `There was an error generating the character image.`;
        }
        //-------------------------------------------------------------------------------

        const embeds = [rankEmbed];

        return interaction.editReply({
            content,
            embeds,
            files,
            components: [BOT_INVITE_ACTION_ROW]
        });
    }

    static async fetchCharacter(searchIgn): Promise<FetchCharacterResult> {

        const result: any = { success: false, info: null };

        const url = `https://dream.ms/index.php?stats=${searchIgn}#speakers`;

        const html = await fetch(url, FetchResultTypes.Text);
        const $ = cheerio.load(html);

        const invalidCharacter = $("h5 ~ div:not(:has(*))").length > 0;
        if (invalidCharacter) {
            return result;
        }

        result.success = true;

        let avatar = $(".speaker img")?.eq(1).attr("src");
            // temp fix for api - not needed anymore, yay!
            // .replace("https://maplestory.io/api/character", "https://api.dream.ms/api/gms/latest/character/2000");

        const [rank, ign] = (() => { // fix staff ign logic
            const nbsp = "  "; // &nbsp
            const h3 = $(".details h3").text();
            return h3.includes(nbsp) ? h3.split(nbsp) : [0, h3];
        })();

        const infoText = $(".fa-ul").text().trim();

        let emblem = $(".social p img").attr("src");
        if (emblem?.match(/\/background\/0/ig)) {
            emblem = undefined;
        }

        result.info = {
            rank: rank,
            ign: ign,
            avatar: avatar,
            url: url,
            job: infoText.match(/Job: (.+)\n/)?.[1] || "", // handle undefined
            level: infoText.match(/Level: (.+)\n/)?.[1],
            exp: infoText.match(/Exp: (.+)\n/)?.[1],
            fame: infoText.match(/Fame: (.+)\n/)?.[1],
            guild: infoText.match(/Guild: (.+)\n/)?.[1],
            alliance: infoText.match(/Alliance: (.+)\n/)?.[1],
            partner: infoText.match(/Partner: (.+)\n/)?.[1],
            family: infoText.match(/Family Leader: (.+)\n/)?.[1],
            dpm: infoText.match(/DPM: (.+)\n/)?.[1],
            emblem: emblem
        };

        return result;
    };

    static createCharacterEmbed(info: CharacterInfo): MessageEmbed {
        const {
            rank, ign, url,
            job, exp, fame,
            guild, alliance, partner, family, dpm
        } = info;

        const level = Number(info.level);

        const guildText = alliance ? `${guild} *(${alliance})*` : guild ? guild : "none";
        const partnerText = partner.match(/^0|-1$/) ? "none" : `[💕 ${partner}](https://dream.ms/index.php?stats=${partner}#speakers)`;

        const currentExpValue = Number(exp.replace(/,/g, ""));
        const cumulativeExp = expTable.cumulativeExp(level, currentExpValue);
        const expToNextLevel = expTable.toNextLevel(level);
        const progressToNextLevel = currentExpValue / expToNextLevel || 0;
        const progressPercent = (progressToNextLevel * 100).toFixed(2);
        const expBar = (barLength => {
            const fill = Math.round(progressToNextLevel * barLength);
            return "█".repeat(fill) + "░".repeat(barLength - fill);
        })(RANK_SETTINGS.PROGRESS_BAR_LENGTH);

        const milestone = level < 200 ? 200 : level < 250 ? 250 : level < 300 ? 300 : null;
        let milestoneText = ``;
        if (milestone) {
            const progressField = targetLevel => {
                targetLevel = Math.min(300, targetLevel);
                if (level < targetLevel) {
                    const expRequired = expTable.cumulativeExp(targetLevel, 0);
                    const progress = cumulativeExp / expRequired;
                    const progressPercent = (cumulativeExp / expRequired * 100).toFixed(2)
                    const expBar = (barLength => {
                        const fill = Math.round(progress * barLength);
                        return "█".repeat(fill) + "░".repeat(barLength - fill);
                    })(RANK_SETTINGS.PROGRESS_BAR_LENGTH);

                    return stripIndents`
                        📈 **Level ${targetLevel} progress**:
                        ${digitSeparator(cumulativeExp)} / ${digitSeparator(expRequired)} **(${progressPercent}%)**
                        ${expBar}
                    `;
                }
                return "";
            };
            milestoneText = `\n\n${progressField(milestone)}\n`;
        }

        return new MessageEmbed()
            .setTitle(`⭐ ${ign}`)
            .setURL(url)
            .setColor("#9e60f0")
            // .setImage(avatar) // we set this in chatInputRun() instead
            .setDescription(stripIndents`
                **Level:** ${level}
                **Job:** ${fetchJobIcon(job)} ${job}
                
                **EXP:** ${exp} / ${digitSeparator(expToNextLevel)} (**${progressPercent}%**)
                ${expBar}
                **Total EXP:** ${digitSeparator(cumulativeExp)} ${milestoneText}
                
                **Fame:** ${fame}
                **Guild:** ${guildText}
                **Partner:** ${partnerText}
                **Family:** ${family || "none"}
                
                **DPM:** ${dpm}
            `)
            .setFooter({
                text: `Data scraped from the Dream MS rankings`,
                iconURL: `https://dream.ms/favicon.png`
            })
            .setTimestamp()
            .setThumbnail(DREAM_MS_LOGO)
    }

    static async createImage(avatar, stats): Promise<{ status: boolean, attachment: MessageAttachment }> {

        const background = bgs[Math.floor(Math.random() * bgs.length)];

        const canvas = createCanvas(400, 300);
        const ctx = canvas.getContext("2d", { alpha: false });
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = false;

        let character, success = false, attempts = 1;
        do {
            try {
                // Draw character avatar
                const timeout = new Promise(resolve => setTimeout(resolve, 5000));
                const loadCharacter = new Promise(resolve => resolve(loadImage(avatar)));

                character = await Promise.race([timeout, loadCharacter]);

                if (!character) { // Will throw error here if character couldn't be loaded in 5 seconds
                    throw "Unable to draw character";
                }

                const x = Math.floor((canvas.width - character.width) / 2);
                const y = Math.floor((canvas.height - character.height) / 2);

                ctx.drawImage(character, x, y);

                if (stats.emblem) {
                    const emblem = await loadImage(stats.emblem).catch(() => null);
                    if (emblem) ctx.drawImage(emblem, 15, 15, 30, 30);
                }

                success = true;

            } catch (e) {

                if (attempts === 1) { // only log the error on first failed attempt
                    container.logger.warn(e);
                }
                container.logger.error(`-- Error drawing character/emblem`);
                container.logger.info(`-- Retrying load character (Attempt ${attempts})`);

            } finally { attempts++; }

        } while (!success && attempts <= 3);

        // Write level and job
        ctx.font = `18px "Maplestory Light"`;
        ctx.miterLimit = 2;
        ctx.lineJoin = "round";
        ctx.lineWidth = 6;

        const characterInfo = `Lv ${stats.level} ${stats.job}`;
        const text_x = canvas.width / 2;
        const text_y = character // if the character can't be loaded, just centre the text
            ? Math.min(canvas.height - 50, (canvas.height + character.height) / 2 + 20)
            : canvas.height / 2;

        // Write text white outline
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.strokeStyle = "#ffffff";
        ctx.strokeText(stats.ign, text_x, text_y);
        ctx.strokeText(characterInfo, text_x, text_y + 20);
        if (stats.guild) {
            ctx.textBaseline = "top";
            ctx.textAlign = "left";
            ctx.strokeText(stats.guild, 50, 18);
            ctx.textBaseline = "middle";
            ctx.textAlign = "center";
        }

        // Write actual text
        ctx.lineWidth = 1;
        ctx.fillStyle = "purple";
        ctx.fillText(stats.ign, text_x, text_y);
        ctx.fillStyle = "black";
        ctx.fillText(characterInfo, text_x, text_y + 20);
        if (stats.guild) {
            ctx.textBaseline = "top";
            ctx.textAlign = "left";
            ctx.fillText(stats.guild, 50, 18);
            ctx.textBaseline = "middle";
            ctx.textAlign = "center";
        }

        const attachment = new MessageAttachment(canvas.toBuffer("image/png"), `dream_${stats.ign}.png`);

        return { status: !!character, attachment: attachment };
    }
}