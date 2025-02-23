const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveup')
        .setDescription('Declare bankruptcy and forfeit the game'),

    run: async ({ interaction, client }) => {
        try {
            // Defer the reply to avoid the 3-second timeout
            await interaction.deferReply();

            // Fetch the game data from the client
            const gameID = interaction.channel.name.split('(')[1]?.split(')')[0];
            if (!gameID) {
                return await interaction.followUp('Could not find the game ID in the thread name.');
            }

            const gameData = client.games[gameID];
            if (!gameData) {
                return await interaction.followUp('Game not found or has already ended.');
            }

            const { playerStats } = gameData;

            // Find the player who invoked the command
            const player = playerStats.find(p => p.id === interaction.user.id);
            if (!player) {
                return await interaction.followUp('You are not part of this game.');
            }

            // Remove the player from the game
            client.games[gameID].playerStats = client.games[gameID].playerStats.filter(p => p.id !== player.id);

            await interaction.followUp(`${player.username} has declared bankruptcy and forfeited the game.`);

        } catch (error) {
            console.error('Error in giveup command:', error);
            await interaction.followUp('There was an error while executing this command!');
        }
    },
};
