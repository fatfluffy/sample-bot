import type { ColorResolvable } from "discord.js";
import { EmojiResolvable, MessageActionRow, MessageEmbed } from "discord.js";
import { stripIndents } from "common-tags";
import { BOT_INVITE_ACTION_ROW } from "../lib/constants.js";
import type { StatCrystal } from "../lib/equips.js";

const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);

interface EquipStats {
    str: number;
    dex: number;
    int: number;
    luk: number;
    wa: number;
    ma: number;
    speed: number;
    jump: number;
}

interface Equip {
    name: string;
    slots: number;
    stats: EquipStats;
    emoji: EmojiResolvable;
    thumbnail: string;
    color: ColorResolvable;
    levelup?: object;
    crystals?: StatCrystal[];
}

interface EquipSession {
    upgrades: number;
    slots: number;
    stats: EquipStats;
    results: any[];
}

export default class EquipInstance {

    levelup?: object;
    originalStats: { stats: EquipStats; slots: number };
    session: any;
    name: string;
    thumbnail: string;
    color: ColorResolvable;
    history: any[];
    user: string;
    userAvatar: string;

    constructor(options: Equip, userData: { user: any; userAvatar: string }) {
        const { name, slots, stats, thumbnail, color, levelup, crystals } = options;
        this.levelup = levelup;
        this.originalStats = { stats, slots };
        this.session = this.createSession(this.originalStats);
        this.addLevelUpStats();
        this.addCraftingStats(crystals);
        this.name = name;
        this.thumbnail = thumbnail;
        this.color = color;
        this.history = [];
        this.user = userData.user;
        this.userAvatar = userData.userAvatar;
    }

    addCraftingStats(crystals: StatCrystal[] = []): void {
        crystals.forEach(crystal => {
            for (const stat in crystal) {
                if (this.session.stats[stat] !== 0) {
                    this.session.stats[stat] += random(crystal[stat][0], crystal[stat][1]);
                }
            }
        });
    }

    addLevelUpStats(): void {
        if (this.levelup) {
            const levelup = this.levelup;
            for (const stat in levelup) {
                let extraStats = 0;
                for (let i = 1; i < 6; i++) {
                    extraStats += random(0, levelup[stat]);
                }
                this.session.stats[stat] += extraStats;
            }
        }
    }

    createSession({ slots, stats }): EquipSession {
        return {
            upgrades: 0,
            slots,
            stats: JSON.parse(JSON.stringify(stats)), // create a deep copy
            results: []
        }
    }

    static components = {
        levelup: {
            type: 2, style: 2,
            emoji: "🔼",
            label: "Level up",
            customId: "levelup"
        },
        slam: {
            type: 2, style: 2,
            emoji: { name: "scrollcs", id: "894418262526398485" },
            label: "Slam!",
            customId: `slam`,
        },
        slamDisabled: {
            type: 2, style: 2,
            emoji: { name: "scrollcs", id: "894418262526398485" },
            label: "Slam!",
            customId: `slamDisabled`,
            disabled: true
        },
        css: {
            type: 2, style: 2,
            emoji: { name: "css", id: "969445345950064671" },
            label: "CSS 20%",
            customId: `css`,
        },
        cssDisabled: {
            type: 2, style: 2,
            emoji: { name: "css", id: "969445345950064671" },
            label: "CSS 20%",
            customId: `cssDisabled`,
            disabled: true
        },
        restart: {
            type: 2, style: 3,
            label: "Restart",
            customId: `restart`,
        },
        stop: {
            type: 2, style: 4,
            label: "Stop",
            customId: `stop`,
        }
    }

    isCssAble() {
        return this.originalStats.slots - this.session.upgrades > this.session.slots;
    }

    createComponents(): MessageActionRow[] {
        const { slam, slamDisabled, css, cssDisabled, restart, stop } = EquipInstance.components;

        const scrollRow: any = { type: 1, components: [] };

        scrollRow.components.push(this.session.slots > 0 ? slam : slamDisabled);
        scrollRow.components.push(restart);
        scrollRow.components.push(stop);
        scrollRow.components.push(this.isCssAble() ? css : cssDisabled);

        return [scrollRow, BOT_INVITE_ACTION_ROW];
    }

    createEmbed() {
        return new MessageEmbed()
            .setAuthor({
                name: `${this.user}'s`,
                iconURL: this.userAvatar
            })
            .setTitle(`${this.name} ${this.session.upgrades ? `(+${this.session.upgrades})` : ``}`)
            .setColor(this.color)
            .setThumbnail(this.thumbnail)
            .setDescription(stripIndents`
                ${this.session.stats.str > 0 ? `STR : +**${this.session.stats.str}**` : ``}
                ${this.session.stats.dex > 0 ? `DEX : +**${this.session.stats.dex}**` : ``}
                ${this.session.stats.int > 0 ? `INT : +**${this.session.stats.int}**` : ``}
                ${this.session.stats.luk > 0 ? `LUK : +**${this.session.stats.luk}**` : ``}
                ${this.session.stats.wa > 0 ? `WEAPON ATTACK : **${this.session.stats.wa}**` : ``}
                ${this.session.stats.ma > 0 ? `MAGIC ATTACK : **${this.session.stats.ma}**` : ``}
                ${this.session.stats.speed > 0 ? `SPEED : +**${this.session.stats.speed}**` : ``}
                ${this.session.stats.jump > 0 ? `JUMP : +**${this.session.stats.jump}**` : ``}
                NUMBER OF UPGRADES AVAILABLE : **${this.session.slots}**
            `.replace(/\n{2,}/g, `\n`)); // replace double linebreaks with single
    }

    cs(csog = false, passRate = 100) {

        if (this.session.slots <= 0) {
            return { pass: false, result: {} };
        }

        this.session.slots--;

        const result = {};
        const pass = Math.floor(Math.random() * 100) + 1 <= passRate;

        if (pass) {
            for (const stat in this.session.stats) {
                if (this.session.stats[stat] <= 0) continue;
                const [range, offset] = csog ? [5, 1] : [11, -5];
                const roll = Math.floor(Math.random() * range) + offset;
                this.session.stats[stat] += roll;
                result[stat] = roll;
                if (this.session.stats[stat] <= 0) {
                    this.session.stats[stat] = 0;
                }
            }

            this.session.upgrades++;
        }

        if (Object.keys(result).length > 0) {
            this.session.results.push(result);
        }

        return { pass, result };
    }

    css(passRate = 20): boolean {
        if (!this.isCssAble()) {
            return false;
        }
        const roll = Math.floor(Math.random() * 100) + 1;
        if (roll <= passRate) {
            this.session.slots++;
            return true;
        }
        else {
            return false;
        }
    }


    restart(): void {
        this.history.push(this.session);
        this.session = this.createSession(this.originalStats);
        this.addLevelUpStats();
    }
}