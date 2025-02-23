const { SlashCommandBuilder } = require('discord.js');
const { properties, railroads, utilities } = require('./JSONbuyables.json');

const HOUSE_LIMIT = 32;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('buyhouse')
    .setDescription('Buy a house for a property you own if you have a monopoly, or buy the property if you do not own it.'),

  run: async ({ interaction, client }) => {
    try {
      await interaction.deferReply();
      // initialize -------------------------------------------------------------------------------------------------------------------
      const gameID = interaction.channel.name.split('(')[1]?.split(')')[0];
      if (!gameID) {
        return await interaction.followUp({ content: 'Could not find the game ID in the thread name.', ephemeral: true });
      }
      const gameData = client.games[gameID];
      if (!gameData) {
        return await interaction.followUp({ content: 'Game not found or has already ended.', ephemeral: true });
      }
      const { playerStats, logChannelId, logMessageId } = gameData;
      const player = playerStats.find(p => p.id === interaction.user.id);
      if (!player) {
        return await interaction.followUp({ content: 'You are not part of this game.', ephemeral: true });
      }
      //----------------------------------------------------------------
      const property = properties.find(p => p.id === player.at);
      const railroad = railroads.find(r => r.id === player.at);
      const utility = utilities.find(u => u.id === player.at);
      let place = property || railroad ||utility;
      if (!place) {
        return await interaction.editReply({ content: 'You are not on buyables.' });
      }
      // ------------------------------------------------------------------------------------------------------------------------------------------------------

      // buying property --------------------------------------------------------------------------------------------------------------------------------------
      if (place.owner !== player.id) { // Buying the place
        if (player.money < place.price) {
          return await interaction.editReply({ content: `You do not have enough money to buy ${place.name}. You need $${place.price}.` });
        }
        player.money -= place.price;
        place.owner = player.id;
        if (property) {
          player.properties.push({ id: place.id, houses: 0, type: place.type });
        } else if (railroad) {
          player.properties.push({ id: place.id, houses: 0, type: 'R' }); // Mark as Railroad
        } else if (utility) {
          player.properties.push({ id: place.id, houses: 0, type: 'U' }); // Mark as Utility
        }
        const placeIndex = (property ? properties : (railroad ? railroads : utilities)).findIndex(p => p.id === place.id);
        if (placeIndex !== -1) (property ? properties : (railroad ? railroads : utilities))[placeIndex] = place;

        client.games[gameID].properties = properties;
        client.games[gameID].railroads = railroads;
        client.games[gameID].utilities = utilities;
        client.games[gameID].playerStats = playerStats;

        const logChannel = await client.channels.fetch(logChannelId).catch(() => null);
        if (!logChannel) {
          return await interaction.followUp({ content: 'Log channel not found.', ephemeral: true });
        }

        let logMessage;
        try {
          logMessage = await logChannel.messages.fetch(logMessageId);
        } catch (error) {
          console.error('Error fetching log message:', error);
          return await interaction.followUp({ content: 'Log message not found.', ephemeral: true });
        }

        if (!logMessage || !logMessage.edit) {
          console.error('Unable to edit log message');
          return await interaction.followUp({ content: 'Unable to edit the log message.', ephemeral: true });
        }

        let logMessageContent = `🎲 **Monopoly Game - ${playerStats.map(p => p.username).join(' vs ')} (${gameID})**\n`;
        logMessageContent += `🏛 **Mode - Classic**\n\n`;
        playerStats.forEach(player => {
          logMessageContent += `👤 **${player.username}**\n`;
          logMessageContent += `💰 Money - $${player.money}\n`;
          logMessageContent += `📍 At - ${player.at}\n`;
          logMessageContent += `🏠 Properties - ${player.properties.length > 0 ? player.properties.map(p => p.id).join(', ') : 'None'}\n`;
          logMessageContent += `🎲 Has Move Left - ${player.move_left === 1 ? 'Yes' : 'No'}\n`;
          logMessageContent += `🚔 Doubles Count - ${player.doubles}\n`;
          logMessageContent += `🦺 Can Build - ${player.can_build}\n\n`;
        });

        await logMessage.edit(logMessageContent);

        return await interaction.editReply({ content: `${interaction.user} has purchased ${place.name} for $${place.price}.` });

      } else if (property) {  
          const colorGroup = properties.filter(p => p.color === property.color);
          const hasMonopoly = colorGroup.every(p => p.owner === player.id);

          if (!hasMonopoly) {
            return await interaction.followUp({ content: 'You must own all properties in this color group to buy a house.', ephemeral: true });
          }

          // Check even build rule
          const canBuild = colorGroup.every(p => p.houses === property.houses || p.houses === property.houses - 1);
          if (!canBuild) {
            return await interaction.followUp({ content: 'You must build houses evenly across the monopoly.', ephemeral: true });
          }

          // Check house limit
          let totalHouses = 0;
          properties.forEach(p => {
            if (p.owner === player.id) {
              totalHouses += p.houses;
            }
          });
          if (totalHouses >= HOUSE_LIMIT) {
            return await interaction.followUp({ content: 'The bank has run out of houses.', ephemeral: true });
          }

          const housePrice = property.pricePerHouse;
          if (player.money < housePrice) {
            return await interaction.followUp({ content: `You do not have enough money to buy a house. You need $${housePrice}.`, ephemeral: true });
          }

          player.money -= housePrice;
          property.houses++;

          const propIndex = properties.findIndex(p => p.id === property.id);
          if (propIndex !== -1) properties[propIndex] = property;
          client.games[gameID].properties = properties;
          client.games[gameID].playerStats = playerStats;

          // Update the log message
          const logChannel = await client.channels.fetch(logChannelId).catch(() => null);
          if (!logChannel) {
            return await interaction.followUp({ content: 'Log channel not found.', ephemeral: true });
          }

          let logMessage;
          try {
            logMessage = await logChannel.messages.fetch(logMessageId);
          } catch (error) {
            console.error('Error fetching log message:', error);
            return await interaction.followUp({ content: 'Log message not found.', ephemeral: true });
          }

          if (!logMessage || !logMessage.edit) {
            console.error('Unable to edit log message');
            return await interaction.followUp({ content: 'Unable to edit the log message.', ephemeral: true });
          }

          let logMessageContent = `🎲 **Monopoly Game - ${playerStats.map(p => p.username).join(' vs ')} (${gameID})**\n`;
          logMessageContent += `🏛 **Mode - Classic**\n\n`;
          playerStats.forEach(player => {
            logMessageContent += `👤 **${player.username}**\n`;
            logMessageContent += `💰 Money - $${player.money}\n`;
            logMessageContent += `📍 At - ${player.at}\n`;
            logMessageContent += `🏠 Properties - ${player.properties.length > 0 ? player.properties.map(p => p.id).join(', ') : 'None'}\n`;
            logMessageContent += `🎲 Has Move Left - ${player.move_left === 1 ? 'Yes' : 'No'}\n`;
            logMessageContent += `🚔 Doubles Count - ${player.doubles}\n`;
            logMessageContent += `🦺 Can Build - ${player.can_build}\n\n`;
          });

          await logMessage.edit(logMessageContent);

          return await interaction.followUp({ content: `You have purchased a house for ${property.name}.`});
        } else {
          return await interaction.editReply({ content: `You cannot buy a house for ${place.name}.` });
        }


    } catch (error) {
      console.error('Error in buyhouse command:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
      } else {
        await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
      }
    }
  },
};