import { Piece, Precondition } from "@sapphire/framework";
import config from "../config.json" assert { type: "json" };
import type { CommandInteraction, Message } from "discord.js";

export class UserPrecondition extends Precondition {

    public constructor(context: Piece.Context, options: Precondition.Options) {
        super(context, {
            ...options,
            name: "OwnerOnly",
            // description: "Only the bot owner can use this command"
        })
    }

    public override async chatInputRun(interaction: CommandInteraction) {
        return interaction.user.id === config.owner.id
            ? this.ok()
            : this.error({
                message: "You are not allowed to use this command!"
            })
    }

    public override async messageRun(msg: Message) {
        return msg.author.id === config.owner.id
            ? this.ok()
            : this.error({
                message: "You are not allowed to use this command!",
                context: { silent: true }
            })
    }
}

declare module '@sapphire/framework' {
    interface Preconditions {
        OwnerOnly: never;
    }
}