const icons = {
    beginner: {
        emoji: "<:job0:899526245333745724>",
        url: "https://cdn.discordapp.com/attachments/894435350481604609/899525996577980428/job0.png"
    },
    warrior: {
        emoji: "<:job1:899526314804002828>",
        url: "https://cdn.discordapp.com/attachments/894435350481604609/899525997714612274/job1.png"
    },
    magician: {
        emoji: "<:job2:899526326833283102>",
        url: "https://cdn.discordapp.com/attachments/894435350481604609/899525999778226196/job2.png"
    },
    bowman: {
        emoji: "<:job3:899526338459877389>",
        url: "https://cdn.discordapp.com/attachments/894435350481604609/899526001002950656/job3.png"
    },
    thief: {
        emoji: "<:job4:899526360299614248>",
        url: "https://cdn.discordapp.com/attachments/894435350481604609/899526002496131092/job4.png"
    },
    pirate: {
        emoji: "<:job5:899526371125125130>",
        url: "https://cdn.discordapp.com/attachments/894435350481604609/899526003943145482/job5.png"
    },
    staff: {
        emoji: "<:gm:957575410701451265>",
        url: "https://media.discordapp.net/attachments/894435350481604609/957575557455970375/gm.png"
    }
};

export default function (job: string, output: "emoji" | "image" = "emoji"): string {

    let result: string = "";

    const classes = {
        warrior: [
            "Warrior",
            "Fighter", "Crusader", "Hero",
            "Page", "White Knight", "Paladin",
            "Spearman", "Dragon Knight", "Dark Knight",
            "Aran",
            "Dawn Warrior"
        ],
        magician: [
            "Magician",
            "F/P Wizard", "F/P Mage", "F/P Arch Mage",
            "I/L Wizard", "I/L Mage", "I/L Arch Mage",
            "Cleric", "Priest", "Bishop",
            "Blaze Wizard"
        ],
        bowman: [
            "Bowman",
            "Hunter", "Ranger", "Bow Master",
            "Crossbowman", "Sniper", "Marksman",
            "Wind Archer"
        ],
        thief: [
            "Thief",
            "Bandit", "Chief Bandit", "Shadower",
            "Assassin", "Hermit", "Night Lord",
            "Night Walker"
        ],
        pirate: [
            "Pirate",
            "Brawler", "Marauder", "Buccaneer",
            "Gunslinger", "Outlaw", "Corsair",
            "Thunder Breaker"
        ],
        staff: [
            "Staff", "GM", "SuperGM"
        ]
    };

    let matchFound = false;
    for (const c in classes) {
        if (matchFound) {
            break;
        }
        if (classes[c].includes(job)) {
            result = icons[c][output];
            matchFound = true;
        }
    }

    if (!matchFound) {
        result = icons.beginner[output];
    }

    return result;
}