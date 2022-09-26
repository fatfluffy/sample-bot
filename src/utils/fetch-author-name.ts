export default async function getAuthorDisplayName(interaction): Promise<string> {
    const member = await interaction.guild?.members.fetch(interaction.user);
    return member?.nickname || interaction.user.username;
}