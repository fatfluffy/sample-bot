import { ApplicationCommandRegistry, Command } from "@sapphire/framework";
import { fetch, FetchResultTypes } from "@sapphire/fetch";
import * as cheerio from "cheerio";
import { CommandInteraction, MessageAttachment } from "discord.js";
import { BOT_INVITE_ACTION_ROW } from "../../lib/constants.js";
import { stripIndents } from "common-tags";

const url = `https://forum.dream.ms/threads/top-5-dpm-ranking-dps-chart.4364/#post-32024`;

export class UserCommand extends Command {

    public constructor(context: Command.Context, options: Command.Options) {
        super(context, {
            ...options,
            name: "dpm",
            description: "Get the latest DPM rankings from the Dream MS forums.",
            detailedDescription: stripIndents`
                **Name**: \`dpm\`
                **Syntax:** \`/dpm\`
                
                **Example usage:**
                \`/dpm\`
                
                **Description:**
                Get the DPM rankings from the forums.
                
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

        const html = await fetch(url, FetchResultTypes.Text);
        const $ = cheerio.load(html);

        const $post = $("#js-post-20781 .message-main");
        const src = $post.find("img:first").attr("src");
        const lastEdit = $post.find(".message-lastEdit time").attr("data-time");

        let file;
        if (src) {
            file = new MessageAttachment(src);
        }

        return interaction.followUp({
            content: `**Dream MS DPM rankings**\n\nLast updated:\n[<t:${lastEdit}:F> (<t:${lastEdit}:R>)](<${url}>)`,
            files: [file],
            components: [BOT_INVITE_ACTION_ROW]
        });
    }
}