import { ApplicationCommandRegistry, Command } from "@sapphire/framework";
import { fetch, FetchResultTypes } from "@sapphire/fetch";
import * as cheerio from "cheerio";
import { CommandInteraction, MessageEmbed } from "discord.js";
import { BOT_INVITE_ACTION_ROW } from "../../lib/constants.js";
import { stripIndents } from "common-tags";

const url = `https://forum.dream.ms/threads/changelog.9/#post-7`;

export class UserCommand extends Command {

    public constructor(context: Command.Context, options: Command.Options) {
        super(context, {
            ...options,
            name: "changelog",
            description: "Get the latest changelog from the Dream MS forums.",
            detailedDescription: stripIndents`
                **Name**: \`changelog\`
                **Syntax:** \`/changelog\`
                
                **Example usage:**
                \`/changelog\`
                
                **Description:**
                Get the latest game changelog from the forums (https://forum.dream.ms/threads/changelog.9/#post-7).
                
                **Arguments:**
                none
            `
        })
    }

    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand(builder =>
            builder
                .setName(this.name)
                .setDescription(this.description)
        );
    }

    public override async chatInputRun(interaction: CommandInteraction) {

        await interaction.deferReply();

        const limit = 1;

        const html = await fetch(url, FetchResultTypes.Text);
        const $ = cheerio.load(html);

        const $post = $("#js-post-7 .message-main");
        const lastEdit = $post.find(".message-lastEdit time").attr("data-time");

        const logs: { date: string; content: string; length: number; }[] = [];
        $post.find(".bbCodeSpoiler").each((index: number, element): any => {
            if (index >= limit) {
                return false;
            }
            const content = $(element).find(".bbCodeBlock-content").text()
                .replace(/\n(?!\n|$|(Bug Fixes)|(Gameplay Changes)|(Skill Changes))/g, "\n- ")
                .replace(/(gameplay changes|skill changes|bug fixes)/ig, "\n**$1**");
            const log = {
                date: $(element).find(".bbCodeSpoiler-button-title").text(),
                content: content,
                length: content.length
            }
            logs.push(log);
        })

        const embeds: MessageEmbed[] = [];
        let totalLength = 0;
        logs.forEach(({ date, content, length }, index) => {
            if (index < 10 && totalLength < (3900 - length)) {
                const embed = new MessageEmbed()
                    .setTitle(date)
                    .setColor("RANDOM")
                    .setDescription(content);
                embeds.push(embed);
            }
        });

        return interaction.followUp({
            content: `**Dream MS Changelog**\n\nLast updated:\n[<t:${lastEdit}:F> (<t:${lastEdit}:R>)](<${url}>)`,
            embeds: embeds,
            components: [BOT_INVITE_ACTION_ROW]
        });
    }
}