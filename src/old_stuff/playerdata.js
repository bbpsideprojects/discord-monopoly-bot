const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('playerdata')
    .setDescription('View your own data in the Monopoly game'),

  run: async ({ interaction, client }) => {
    await interaction.deferReply({ ephemeral: true }); // Keep ephemeral for player-specific data

    try {
      const userId = interaction.user.id;
      const channel = interaction.channel;

      if (channel.type !== 11) { // 11 represents private threads
        return await interaction.editReply({ content: 'This command can only be used in your monitor channel.' });
      }
      const gameID = interaction.channel.name.split('(')[1]?.split(')')[0];
      if (!gameID) {
        return await interaction.editReply({ content: 'Could not find the game ID in the thread name.' }); // Use editReply
      }

      const gameData = client.games[gameID];
      if (!gameData) {
        return await interaction.editReply({ content: 'Game not found or has already ended.' }); // Use editReply
      }

      const player = gameData.playerStats.find(p => p.id === userId);
      if (!player) {
        return await interaction.editReply({ content: 'You are not part of this game.' }); // Use editReply
      }

      const embed = new EmbedBuilder()
        .setTitle(`Your Player Data: ${player.username}`)
        .setDescription(`Here is your current data in the game:`)
        .setColor(0x00FF00);

      embed.addFields(
        { name: '💰 Money', value: `$${player.money}`, inline: true },
        { name: '📍 Position', value: `${player.at}`, inline: true },
        { name: '🚔 Jail', value: player.jail > 0 ? `In jail for ${player.jail} turns` : 'Not in jail', inline: true },
      );

      // Format properties for display (more readable)
      if (player.properties.length > 0) {
        const propertyNames = player.properties.map(property => {
            const propertyData = client.games[gameID].properties.find(p => p.id === property.id) || client.games[gameID].railroads.find(r => r.id === property.id) || client.games[gameID].utilities.find(u => u.id === property.id);
            return propertyData ? propertyData.name : `Property ID: ${property.id}`; // Handle cases where property data might be missing
        }).join(', ');
        embed.addFields({ name: '🏠 Properties', value: propertyNames, inline: false });
      } else {
        embed.addFields({ name: '🏠 Properties', value: 'None', inline: false });
      }

      if (player.cards.length > 0) {
        embed.addFields({ name: '🎟 Cards', value: player.cards.join(', '), inline: false });
      } else {
        embed.addFields({ name: '🎟 Cards', value: 'None', inline: false });
      }

      embed.setFooter({ text: `Game ID: ${gameID}` }).setTimestamp();

      await interaction.editReply({ embeds: [embed] }); // Use editReply

    } catch (error) {
      console.error('Error in playerdata command:', error);
      await interaction.editReply({ content: 'There was an error while executing this command!' }); // Use editReply
    }
  },
};