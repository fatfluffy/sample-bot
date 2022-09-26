import { Subcommand } from "@sapphire/plugin-subcommands";
import type { ApplicationCommandRegistry } from "@sapphire/framework";
import { Message, MessageComponent, MessageEmbed } from "discord.js";
import { fetch, FetchResultTypes } from "@sapphire/fetch";
import { stripIndents } from "common-tags";
import { BOT_INVITE_ACTION_ROW, NUMBER_EMOJIS as digits } from "../../lib/constants.js";
import digitSeparator from "../../utils/digit-separator.js";

// interface WikiFetchResult {
//     code: number;
//     messages: any[];
//     result?: WikiSearchResult;
//     status: string;
// }

interface WikiSearchResult {
    exactMatchInfo: {
        itemInfo: [ItemInfo];
        mobInfo: [MobInfo];
        jobInfo: [SkillInfo];
        skillInfo: [SkillInfo];
    };
    itemInfo: ItemInfo[];
    jobInfo: SkillInfo[];
    mobInfo: MobInfo[];
}

interface MobsThatDropThisItem {
    dropChance: string;
    mobDescription: string;
    mobId: string;
    mobMeta: MobMeta;
    mobName: string;
}

interface ItemInfo {
    itemDescription: string;
    itemId: number;
    itemMaxAmount: number;
    itemMeta: ItemMeta;
    itemMinAmount: number;
    itemName: string;
    itemTypeInfo: {
        category: string;
        highItemId: number;
        lowItemId: number;
        overallCategory: "Use";
        subCategory: "Food and Drink";
    }
    mobsThatDropTheItem: MobsThatDropThisItem[];
}

interface MobDropItemInfo {
    dropChance: string;
    itemDescription: string;
    itemEquipGroup: string;
    itemId: number;
    itemMaxAmount: number;
    itemMeta: ItemMeta;
    itemMinAmount: number;
    itemName: string;
    itemTypeInfo: object;
}

interface MobDropMoneyInfo {
    amount: number;
    dropChance: string;
    itemId: number;
}

interface MobInfo {
    drops: {
        items?: MobDropItemInfo[];
        money?: MobDropMoneyInfo[];
    };
    locations: string[];
    mobId: string;
    mobMeta: MobMeta;
    mobName: string
}

interface SkillInfo {
    description: string;
    id: string;
    level: string[]; // individual skill level details
    maxLevel: number;
    name: string;
}

interface MobMeta {
    accuracy: number;
    accuracyRequiredToHit: number;
    elementalAttributes?: string;
    evasion: number;
    exp: number;
    hideName: boolean;
    isAutoAggro: boolean;
    isBodyAttack: boolean;
    isUndead: boolean;
    level: number;
    locations: string[];
    magicDamage: number;
    magicDefense: number;
    maxHP: number;
    maxMP: number;
    minimumPushDamage: number;
    physicalDamage: number;
    physicalDefense: number;
    revivesMonsterId?: MobMeta[];
    speed: number;
    summonType: number;
}

interface ItemMeta {
    cash?: { cash: boolean };
    chair?: object; // {reqLevel: number}
    equip?: object;
    consumeSpec?: object;
    only?: boolean;
    shop?: { price?: number; notSale?: boolean };
    itemMinAmount?: number;
    itemName?: string;
}

type anyMatchInfo = ItemInfo | MobInfo | SkillInfo;

const enum SearchTypes {
    Item = "item",
    // Job = "job",
    Mob = "mob",
    Skill = "skill"
}

export class UserCommand extends Subcommand {

    public constructor(context: Subcommand.Context, options: Subcommand.Options) {
        super(context, {
            ...options,
            name: "wiki",
            description: "Access the Dream MS wiki",
            detailedDescription: stripIndents`
                **Name**: \`wiki\`
                **Syntax:** \`/wiki <mob|item|skill> <search>\`
                
                **Example usage:**
                \`/item white scroll\`
                \`/mob flower drift bunny\`
                \`/skill call of cygnus\`
                
                **Description:**
                Search the Dream MS wiki. **You do not need to type /wiki**, just **/item**, **/mob** or **/skill** for short.
                
                **Arguments:**
                \`<search>\`: *(required)* Whatever you want to search for. If not an exact match, the bot will show up to 10 closest matches.
            `,
            subcommands: [
                { name: "item", chatInputRun: "chatInputItem" },
                { name: "mob", chatInputRun: "chatInputMob" },
                { name: "skill", chatInputRun: "chatInputSkill" }
            ]
        });
    }

    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand(builder =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addSubcommand(subcommand =>
                    subcommand
                        .setName("mob")
                        .setDescription("Look up a mob on the Dream MS wiki.")
                        .addStringOption(option =>
                            option
                                .setName("mob")
                                .setDescription("Mob name to search for")
                                .setRequired(true)
                        )
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName("item")
                        .setDescription("Look up an item on the Dream MS wiki.")
                        .addStringOption(option =>
                            option
                                .setName("item")
                                .setDescription("Item name to search for")
                                .setRequired(true)
                        )
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName("skill")
                        .setDescription("Look up a skill on the Dream MS wiki.")
                        .addStringOption(option =>
                            option
                                .setName("skill")
                                .setDescription("Skill name to search for")
                                .setRequired(true)
                        )
                )
        );
    }

    static async fetchResults(type: SearchTypes, search: string): Promise<anyMatchInfo[] | false> {
        const url = `https://backend.dream.ms/api/v1/search?q=${encodeURIComponent(search)}`;
        const timeout: any = new Promise(resolve => setTimeout(() => resolve({ result: null }), 5000));
        const fetchResult: any = await Promise.race([timeout, fetch(url, FetchResultTypes.JSON)]).catch(() => null);
        // const { result }: WikiFetchResult = await fetch(url, FetchResultTypes.JSON);

        if (fetchResult?.result) {
            const { result } = fetchResult;
            const resultType = `${type}Info`;

            return result.exactMatchInfo[resultType].length
                ? result.exactMatchInfo[resultType]
                : result[resultType].length
                    ? result[resultType]
                    : false;
        }
        return false;
    }

    static createBestMatchesComponents(type: SearchTypes, matches: anyMatchInfo[]) {
        // const property = UserCommand.getSearchPropertyName(type);

        const buttons: any[] = [];
        for (let i = 0; i < matches.length; i++) {
            buttons.push({
                type: "BUTTON",
                style: "SECONDARY",
                emoji: { name: digits[i + 1] },
                custom_id: `closest_match_${i}`
            })
        }

        const components: MessageComponent[] = [];

        const firstRow: any = { type: "ACTION_ROW", components: [] };
        const secondRow: any = { type: "ACTION_ROW", components: [] };
        for (let i = 0; i < matches.length; i++) {
            if (i < 5) {
                firstRow.components.push(buttons[i]);
            }
            else {
                secondRow.components.push(buttons[i]);
            }
        }
        components.push(firstRow);
        if (secondRow.length) {
            components.push(secondRow);
        }

        return components;
    }

    static async createClosestMatchesEmbed(type: SearchTypes, matches: anyMatchInfo[], searchTerm: string): Promise<MessageEmbed> {
        const displayLimit = 10;

        const property = UserCommand.getSearchPropertyName(type);

        const description = matches.reduce(
            (prev: string, current, index: number) => {
                const param = current[property];
                return index < displayLimit
                    ? `${prev}\n ${digits[index + 1]} ${param}`
                    : prev; // don't reduce anymore if over display limit
            },
            ""
        );

        return new MessageEmbed()
            .setTitle("Dream MS Wiki")
            .setColor("#6F3DFE")
            .setDescription(`No exact match for \`${searchTerm}\`. Here are the closest matches:\n${description}`);
    }

    static getSearchPropertyName(type: SearchTypes): string {
        switch (type) {
            case SearchTypes.Item:
                return "itemName";

            // case SearchTypes.Job:
            case SearchTypes.Skill:
                return "name";

            case SearchTypes.Mob:
                return "mobName";

            default:
                return "name";
        }
    }

    static formatDescription(text: string) {
        return text.replace(/#c(.+)#/g, "**$1**")
            .replace(/\\r/g, "")
            .replace(/\\n/g, "\u000A") // newline
    }

    static async createExactMatchEmbed(type: SearchTypes, match: anyMatchInfo, searchTerm: string): Promise<MessageEmbed> {
        let title, description, thumbnail;

        switch (type) {
            case SearchTypes.Item: {
                title = (<ItemInfo>match).itemName;
                const itemDesc = (<ItemInfo>match).itemDescription;
                const mobsThatDropTheItem = (<ItemInfo>match).mobsThatDropTheItem.reduce(
                    (prev: string, { mobName, dropChance }, _index: number) => //
                        `${prev} ${mobName} (${dropChance})\n`,
                    ""
                );

                description = stripIndents`
                    ${UserCommand.formatDescription(itemDesc)}
                    
                    **Dropped by**
                    ${mobsThatDropTheItem}
                `;

                const { itemId } = <ItemInfo>match;
                thumbnail = `https://api.dream.ms/api/gms/latest/item/${itemId}/icon`;
            }
                break;


            // case SearchTypes.Job:
            //     break;

            case SearchTypes.Mob: {
                title = (<MobInfo>match).mobName;
                const {
                    level, maxHP, exp,
                    physicalDamage, magicDamage
                } = (<MobInfo>match).mobMeta;

                const locations = (<MobInfo>match).locations;

                const dropList = (<MobInfo>match).drops.items?.reduce(
                    (prev: string, { itemName, dropChance }, _index: number) => //
                        `${prev} ${itemName} (${dropChance})\n`,
                    ""
                );

                const locationList = locations.length ? locations.join("\n") : "none";

                description = stripIndents`
                    **Level:** ${level}
                    **HP:** ${digitSeparator(maxHP)}
                    **EXP:** ${digitSeparator(exp * 4)}
                    
                    **Attack:** ${physicalDamage}
                    **Magic Attack:** ${magicDamage}
                    
                    **Locations:**
                    ${locationList}
                    
                    **Item drops**
                    ${dropList}
                `;

                const { mobId } = <MobInfo>match;
                thumbnail = `https://api.dream.ms/api/gms/latest/mob/animated/${mobId}/move.gif`;
            }
                break;


            case SearchTypes.Skill: {
                title = (<SkillInfo>match).name;
                const { id, maxLevel, level, description: skillDescription } = <SkillInfo>match;

                const details = level.reduce(
                    (prev: string, current: string, index) => //
                        `${prev}\n**Level ${index + 1}:** ${current}`,
                    ""
                );

                description = stripIndents`
                    ${UserCommand.formatDescription(skillDescription)}
                    **Master Level: ${maxLevel}**
                    
                    ${details}
                `;

                // todo add skill thumbnail
            }
                break;

            default:
        }

        return new MessageEmbed()
            .setTitle(title)
            .setURL(`https://wiki.dream.ms/?search=${encodeURIComponent(searchTerm)}`)
            .setColor("#6F3DFE")
            .setDescription(description)
            .setThumbnail(thumbnail)
            .setImage(thumbnail)
            .setFooter({
                text: `Data scraped from the Dream MS Wiki`,
                iconURL: `https://dream.ms/favicon.png`
            })
            .setTimestamp()
    }

    static async handleSubcommand(commandInteraction: Subcommand.ChatInputInteraction, type: SearchTypes) {

        const msg = <Message>await commandInteraction.deferReply({ fetchReply: true });

        const search = <string>commandInteraction.options.getString(type);
        const result = await UserCommand.fetchResults(type, search);

        if (!result) {
            return commandInteraction.followUp({
                content: `No ${type} matches for \`${search}\` <:nwoo:1016508696743907398>`
            })
        }

        const isExactMatch = result.length === 1;

        let embed: MessageEmbed, components;
        if (isExactMatch) {
            embed = await UserCommand.createExactMatchEmbed(type, result[0], search);
            components = [];
        }
        else {
            components = UserCommand.createBestMatchesComponents(type, result);
            embed = await UserCommand.createClosestMatchesEmbed(type, result, search);
        }

        try {
            const reply = await commandInteraction.followUp({
                embeds: [embed],
                components
            });

            if (isExactMatch) {
                return reply;
            }
        } catch (e) {
            return console.error(e);
        }

        let searchId;
        try {
            await msg.awaitMessageComponent({
                filter: msgInteraction => {
                    if (msgInteraction.user.id === commandInteraction.user.id) {
                        searchId = msgInteraction.customId.slice(-1); // `closest_match_${id}`
                        return true;
                    }
                    return false;
                },
                time: 30_000
            });
        } catch (e) {
            searchId = 0;
        }

        const property = UserCommand.getSearchPropertyName(type);

        embed = await UserCommand.createExactMatchEmbed(type, result[searchId], result[searchId][property]);

        return commandInteraction.followUp({
            embeds: [embed],
            components: [BOT_INVITE_ACTION_ROW]
        });
    }

    public async chatInputItem(interaction: Subcommand.ChatInputInteraction) {
        await UserCommand.handleSubcommand(interaction, SearchTypes.Item);
    }

    public async chatInputMob(interaction: Subcommand.ChatInputInteraction) {
        await UserCommand.handleSubcommand(interaction, SearchTypes.Mob);
    }

    public async chatInputSkill(interaction: Subcommand.ChatInputInteraction) {
        await UserCommand.handleSubcommand(interaction, SearchTypes.Skill);
    }
}