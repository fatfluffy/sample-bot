export type StatRange = [number, number];

export interface StatCrystal {
    str?: StatRange,
    dex?: StatRange,
    int?: StatRange,
    luk?: StatRange,
    wa?: StatRange,
    ma?: StatRange,
}

export const Crystals = {
    POWER: { str: [5, 5] },
    DEX: { dex: [5, 5] },
    WISDOM: { int: [5, 5] },
    LUK: { luk: [5, 5] },
    DARK: { str: [1, 5], dex: [1, 5], int: [1, 5], luk: [1, 5] },
    BLACK: { wa: [1, 6], ma: [1, 6] }
};

const equips = {
    bfc: {
        name: "Blackfist Cloak",
        slots: 7,
        stats: { str: 0, dex: 0, int: 0, luk: 0, wa: 5, ma: 0, speed: 0, jump: 0 },
        emoji: "<:bfc:967988064402178049>",
        thumbnail: "https://cdn.discordapp.com/attachments/967988459656601660/967988530028625980/bfc.png",
        color: "#000000"
    },
    fs: {
        name: "Facestompers",
        slots: 9,
        stats: { str: 0, dex: 0, int: 0, luk: 0, wa: 5, ma: 0, speed: 0, jump: 0 },
        emoji: "<:fs:967988074711744542>",
        thumbnail: "https://cdn.discordapp.com/attachments/962311887050113054/962312016079519764/fs.png",
        color: "#660000"
    },
    oz: {
        name: "Oz's Brilliant Belt",
        slots: 5,
        stats: { str: 1, dex: 1, int: 1, luk: 1, wa: 1, ma: 5, speed: 0, jump: 0 },
        emoji: "<:oz:967988129485164594>",
        thumbnail: "https://cdn.discordapp.com/attachments/962311887050113054/962311959729029160/belt.png",
        color: "#FFFF00"
    },
    abr: {
        name: "Angelic Blessing",
        slots: 5,
        stats: { str: 3, dex: 3, int: 3, luk: 3, wa: 5, ma: 5, speed: 0, jump: 0 },
        emoji: "<:abr:967988052880420905>",
        thumbnail: "https://cdn.discordapp.com/attachments/962311887050113054/962998552395665418/abr.png",
        color: "#FFBBFF"
    },
    eye: {
        name: "Magic Eye Patch",
        slots: 5,
        stats: { str: 3, dex: 3, int: 3, luk: 3, wa: 5, ma: 6, speed: 0, jump: 0 },
        emoji: "<:eyepatch:967988085696630795>",
        thumbnail: "https://cdn.discordapp.com/attachments/962311887050113054/962998585224470608/eyepatch.png",
        color: "#772233"
    },
    roa: {
        name: "Ring of Alchemist",
        slots: 3,
        stats: { str: 1, dex: 1, int: 1, luk: 1, wa: 0, ma: 0, speed: 0, jump: 0 },
        emoji: "<:roa:967988119666298910>",
        thumbnail: "https://cdn.discordapp.com/attachments/962311887050113054/963012914883735592/roa.png",
        color: "#99AABB"
    },
    czak: {
        name: "Chaos Zakum Helmet",
        slots: 12,
        stats: { str: 24, dex: 24, int: 24, luk: 24, wa: 0, ma: 0, speed: 0, jump: 0 },
        emoji: "<:czak:967988094227873883>",
        thumbnail: "https://cdn.discordapp.com/attachments/962311887050113054/963435445893619712/czak.png",
        color: "#AA8866"
    },
    chtp: {
        name: "Chaos Horntail Necklace",
        slots: 2,
        stats: { str: 20, dex: 20, int: 20, luk: 20, wa: 26, ma: 26, speed: 0, jump: 0 },
        emoji: "<:chtp:996122590395502803>",
        thumbnail: "https://cdn.discordapp.com/attachments/967988459656601660/996122676068360192/chtp.png",
        color: "#743426"
    },
    ml: {
        name: "Timeless Moonlight",
        slots: 7,
        stats: { str: 0, dex: 0, int: 0, luk: 0, wa: 6, ma: 11, speed: 0, jump: 0 },
        levelup: { str: 1, dex: 1, int: 1, luk: 1, wa: 2, ma: 2, speed: 2, jump: 1 },
        emoji: "<:moonlight:971657503551127582>",
        thumbnail: "https://cdn.discordapp.com/attachments/967988459656601660/971657671541395516/moonlight.png",
        color: "#FFFFFF"
    },
    terror: {
        name: "Endless Terror",
        slots: 5,
        stats: { str: 3, dex: 3, int: 3, luk: 3, wa: 1, ma: 1, speed: 0, jump: 0 },
        crystals: [Crystals.POWER, Crystals.DEX, Crystals.WISDOM, Crystals.LUK, Crystals.BLACK, Crystals.DARK],
        // levelup: { str: 5, dex: 5, int: 5, luk: 5, wa: 6, ma: 6, speed: 0, jump: 0 },
        emoji: "<:terror:1023023203225968710>",
        thumbnail: "https://cdn.discordapp.com/attachments/967988459656601660/1023023400056279060/terror.png",
        color: "#654882"
    },
    cfe: {
        name: "Commanding Force Earrings",
        slots: 7,
        stats: { str: 5, dex: 5, int: 5, luk: 5, wa: 0, ma: 0, speed: 0, jump: 0 },
        crystals: [Crystals.POWER, Crystals.DEX, Crystals.WISDOM, Crystals.LUK, Crystals.BLACK, Crystals.DARK],
        // levelup: { str: 5, dex: 5, int: 5, luk: 5, wa: 6, ma: 6, speed: 0, jump: 0 },
        emoji: "<:cfe:1023023201304985661>",
        thumbnail: "https://cdn.discordapp.com/attachments/967988459656601660/1023023476203851866/cfe.png",
        color: "#72655d"
    },
    berserked: {
        name: "Berserked",
        slots: 7,
        stats: { str: 5, dex: 5, int: 5, luk: 5, wa: 0, ma: 0, speed: 0, jump: 0 },
        crystals: [Crystals.POWER, Crystals.DEX, Crystals.WISDOM, Crystals.LUK, Crystals.BLACK, Crystals.DARK],
        // levelup: { str: 5, dex: 5, int: 5, luk: 5, wa: 6, ma: 6, speed: 0, jump: 0 },
        emoji: "<:berserked:1023023199258169445>",
        thumbnail: "https://cdn.discordapp.com/attachments/967988459656601660/1023023534777323530/berserked.png",
        color: "#f0dec7"
    }
};

export default equips;


