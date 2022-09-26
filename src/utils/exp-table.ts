import { EXP_TABLE } from "../lib/constants.js";

export function toNextLevel(level): number {
    level = Number(level);
    if (level === 300) {
        return 0;
    }
    else if (level >= 1 && level < 300 && level % 1 === 0) {
        return EXP_TABLE[level][0];
    }
    else {
        return -1;
    }
}

export function cumulativeExp(level, exp): number {
    return level > 1 ? EXP_TABLE[level - 1][1] + exp : 0;
}

export function progress(cumulativeExp, targetLevel): number {
    return cumulativeExp / EXP_TABLE[targetLevel - 1][1];
}