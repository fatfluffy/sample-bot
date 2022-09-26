import { ApplicationCommandRegistry, Command, container } from "@sapphire/framework";
import { Time } from "@sapphire/time-utilities";
import { CommandInteraction, Message, MessageEmbed, Snowflake } from "discord.js";
import { stripIndents } from "common-tags";
import equips from "../../lib/equips.js";
import EquipInstance from "../../classes/equip-instance.js";
import getUsername from "../../utils/fetch-author-name.js";
import { BOT_INVITE_ACTION_ROW } from "../../lib/constants.js";

// get list of all available equips
const equipChoices: { name: string, value: string }[] = [];
let equipList = "";
for (const eqCode in equips) {
    const equipName = equips[eqCode]["name"];
    const equipEmoji = equips[eqCode]["emoji"];

    // for command description
    equipList += `${equipEmoji} ${equipName}\n`;

    // for command input choices
    equipChoices.push({ name: equipName, value: eqCode });
}

// Create a session cache
container.sessions = new Map();
declare module "@sapphire/pieces" {
    interface Container {
        sessions: Map<Snowflake, { url: string; messageId: string; }>;
    }
}

export class UserCommand extends Command {

    public constructor(context: Command.Context, options: Command.Options) {
        super(context, {
            ...options,
            name: "cs",
            description: "Chaos Scroll simulator; only selected equips supported.",
            detailedDescription: stripIndents`
                **Name**: \`/cs\`
                **Syntax:** \`/cs <equip> [pass]\`
                
                **Example usage:**
                \`/cs Blackfist Cloak True\`
                \`/cs Angelic Blessing\`
                
                **Description:**
                Simulate a Chaos Scroll session. By default, CS is simulated to have 60% success rate; you will need to CSS 20% the failed slots. You can skip this check by setting \`pass\` to \`True\`.
                
                **Arguments:**
                \`<equip>\`: *(required)* Any of the following preset equips.
                ${equipList}
                
                \`[pass]\`: *(optional)* If set to true, the **60% check will be ignored**. Useful if you want to simulate only the stat-rolling aspect of Chaos Scrolls and ignore the passing RNG.
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
                        .setName("equip")
                        .setDescription("Choose an equipment to scroll")
                        .setRequired(true)
                        .addChoices(...equipChoices)
                )
                .addBooleanOption(option =>
                    option
                        .setName("pass")
                        .setDescription("set success rate to 100%")
                        .setRequired(false)
                )
        );
    }

    public override async chatInputRun(commandInteraction: CommandInteraction) {

        const userId = commandInteraction.user.id;
        const username = commandInteraction.user.tag;

        // Prevent the same user from running multiple CS sessions
        const findSession = container.sessions.get(userId);
        if (findSession) {
            container.logger.warn(`Prevented ${username} from starting a new session.`);
            return commandInteraction.reply({
                content: stripIndents`
                    <@${userId}>, you have an active session [here](<${findSession.url}>).
                    Please click **Stop** to end it before starting a new **/cs** session.
                `,
                ephemeral: false
            });
        }

        const eqCode = commandInteraction.options.getString("equip")!;
        const passAll = commandInteraction.options.getBoolean("pass");
        const csog = false;

        const eqData = JSON.parse(JSON.stringify(equips[eqCode]));

        const userData = {
            user: await getUsername(commandInteraction),
            userAvatar: commandInteraction.user.displayAvatarURL()
        }

        const eq = new EquipInstance(eqData, userData);

        const embed = eq.createEmbed();
        const menu = eq.createComponents();

        const msg = <Message>await commandInteraction.reply({
            components: menu,
            embeds: [embed],
            fetchReply: true
        });

        // Initialise the session
        container.sessions.set(userId, {
            url: msg.url,
            messageId: msg.id
        })

        const collector = msg.createMessageComponentCollector({
            filter: msgInteraction => msgInteraction.user.id === userId,
            componentType: "BUTTON",
            time: Time.Minute * 10
        });

        let attempts = 1,
            totalCsUsed = 0,
            totalCssUsed = 0,
            messageContent;

        collector.on("collect", async msgInteraction => {
            let embeds: MessageEmbed[] = [];
            let components: any[];
            let eqEmbed, resultEmbed;

            switch (msgInteraction.customId) {

                case "slam":
                    const passRate = passAll ? 100 : 60;
                    const { pass, result } = eq.cs(csog, passRate);
                    totalCsUsed++;

                    let resultText = ``;
                    if (pass) {
                        for (const stat in result) {
                            let change = result[stat];
                            change = change >= 0 ? `+${change}` : change;
                            resultText += `**${change}** ${stat.toUpperCase()}, `;
                        }
                        resultText = resultText.slice(0, -2);
                    }
                    else {
                        resultText = "The <:scrollcs:894418262526398485> Chaos Scroll **failed**!";
                    }

                    resultEmbed = new MessageEmbed()
                        .setColor(pass ? `#84fc87` : `#ff0000`)
                        .setTitle(pass ? `✅ Passed` : `❌ Failed`)
                        .setDescription(stripIndents`
                            ${resultText}
                            
                            Scrolls used:
                            <:scrollcs:894418262526398485> x**${totalCsUsed}**
                            <:css:969445345950064671> x**${totalCssUsed}** 
                        `)

                    components = eq.createComponents();
                    break;

                case "stop":
                    collector.stop();
                    resultEmbed = new MessageEmbed()
                        .setColor(`#000000`)
                        .setDescription(stripIndents`
                            Scrolls used:
                            <:scrollcs:894418262526398485> x**${totalCsUsed}**
                            <:css:969445345950064671> x**${totalCssUsed}** 
                        `)
                    components = [];
                    break;

                case "restart":
                    eq.restart();
                    components = eq.createComponents();
                    attempts++;
                    break;

                case "css":
                    const cssResult = eq.css();
                    totalCssUsed++;
                    resultEmbed = new MessageEmbed()
                        .setColor(cssResult ? `#84fc87` : `#ff0000`)
                        .setTitle(cssResult ? `✅ Passed` : `❌ Failed`)
                        .setDescription(stripIndents`
                            The <:css:969445345950064671> Clean Slate Scroll 20% **${cssResult ? "passed" : "failed"}**!
                            
                            Scrolls used:
                            <:scrollcs:894418262526398485> x**${totalCsUsed}**
                            <:css:969445345950064671> x**${totalCssUsed}** 
                        `)
                        .setFooter({ text: `💡 Tip: Set the \`pass\` option to \`True\` to use 100% pass rate Chaos Scrolls!` });
                    components = eq.createComponents();
                    break;

                default: // handle unregistered cases I guess?
                    components = eq.createComponents();
                    break;
            }

            if (resultEmbed) {
                embeds.push(resultEmbed);
            }

            eqEmbed = eq.createEmbed();
            embeds.push(eqEmbed);

            messageContent = `Total rerolls: **${attempts}**`

            try {
                await msgInteraction.update({
                    content: messageContent,
                    components,
                    embeds
                });
            } catch (e) {
                console.log("Error updating interaction.");
                container.logger.error(e);
                collector.stop();
            }
        });

        collector.on("end", async _collection => {
            try {
                const endSession = container.sessions.delete(userId);
                container.logger.info(`${username} (${userId}): ${endSession ? "Ended session" : "Error ending session"}`);
                await commandInteraction.editReply({
                    content: messageContent,
                    components: [BOT_INVITE_ACTION_ROW]
                });
            } catch (e) {
                container.client.logger.error(e);
            }
        });
    }
}