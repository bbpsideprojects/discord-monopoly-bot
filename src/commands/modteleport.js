const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('teleport')
        .setDescription('Teleport yourself to any space on the board (DEBUG ONLY)')
        .addIntegerOption(option =>
            option.setName('space')
                .setDescription('The space number to teleport to')
                .setRequired(true)
        ),

    run: async ({ interaction, client }) => {
        try {
            const channelId = interaction.channel.id;
            const gameEntry = Object.values(client.games).find(game => game.setupChannelId === channelId);

            if (!gameEntry) {
                return await interaction.reply({
                    content: "No Monopoly game has been set up in this channel.",
                    ephemeral: true,
                });
            }

            const gameID = gameEntry.gameID;
            const game = client.games[gameID];
            const player = game.playerStats.find(p => p.id === interaction.user.id);

            if (!player) {
                return await interaction.reply({
                    content: "You are not part of this game.",
                    ephemeral: true,
                });
            }

            const space = interaction.options.getInteger('space');

            if (space < 1 || space > 40) { // Assuming 40 spaces on the board
                return await interaction.reply({
                    content: "Invalid space number. Please enter a number between 1 and 40.",
                    ephemeral: true,
                });
            }

            player.at = space;
            if (player.at === 11)
            {
                player.jail = 1;
            }
            await interaction.reply({
                content: `${player.username} has been teleported to space ${space}.`,
                ephemeral: true, // Make it ephemeral for debugging
            });

        } catch (error) {
            console.error('Error in /teleport command:', error);
            await interaction.reply({
                content: "An error occurred while teleporting.",
                ephemeral: true,
            });
        }
    },
};