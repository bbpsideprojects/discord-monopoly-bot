const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const propertiesData = require('./JSONbuyables.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('viewboard')
    .setDescription('View the current state of the Monopoly board'),

  run: async ({ interaction, client }) => {
    await interaction.deferReply();

    try {
      const gameID = interaction.channel.name.split('(')[1]?.split(')')[0];

      if (!gameID) {
        return await interaction.followUp('Could not find the game ID in the thread name.');
      }

      const gameData = client.games[gameID];

      if (!gameData) {
        return await interaction.followUp('Game not found or has already ended.');
      }

      const { playerStats } = gameData;
      const boardLayout = JSON.parse(JSON.stringify(require('./boardLayout.json')));
      const positionPlayers = {};
      const propertyOwners = {};

      playerStats.forEach(player => {
        player.properties.forEach(ownedProperty => {
          propertyOwners[ownedProperty.id] = player;
        });

        const playerPosition = player.at;
        if (playerPosition >= 1 && playerPosition <= 40) {
          if (!positionPlayers[playerPosition]) {
            positionPlayers[playerPosition] = [];
          }
          positionPlayers[playerPosition].push(player);
        }
      });

      const ownerInfo = {};
      boardLayout.forEach(space => {
        const property = propertiesData.properties.find(p => p.name === space.property);
        const railroad = propertiesData.railroads.find(r => r.name === space.property);
        const utility = propertiesData.utilities.find(u => u.name === space.property);
  
        if (property && property.owner) {
          const owner = playerStats.find(p => p.id === property.owner);
          space.icon = owner.icon;
          ownerInfo[space.property] = owner.username;
        } else if (railroad && railroad.owner) {
          const owner = playerStats.find(p => p.id === railroad.owner);
          space.icon = owner.icon;
          ownerInfo[space.property] = owner.username;
        } else if (utility && utility.owner) {
          const owner = playerStats.find(p => p.id === utility.owner);
          space.icon = owner.icon;
          ownerInfo[space.property] = owner.username;
        } else if (property) {
          switch (space.icon) {
            case '🟫': space.icon = '🟤'; break;
            case '⬛': space.icon = '⚫'; break;
            case '🟪': space.icon = '🟣'; break;
            case '🟧': space.icon = '🟠'; break;
            case '🟥': space.icon = '🔴'; break;
            case '🟨': space.icon = '🟡'; break;
            case '🟩': space.icon = '🟢'; break;
            case '🟦': space.icon = '🔵'; break;
          }
        } else if (railroad) {
          space.icon = '🚈';
        } else if (utility) {
          space.icon = '💡';
        }
      });

      Object.keys(positionPlayers).forEach(position => {
        const playersAtPosition = positionPlayers[position];
        if (playersAtPosition.length > 1) {
          boardLayout[position - 1].icon = `${playersAtPosition.length}️⃣`;
        } else if (playersAtPosition.length === 1) {
          boardLayout[position - 1].icon = playersAtPosition[0].icon;
        }
      });

      const board = [
        `${boardLayout[20].icon}${boardLayout[21].icon}${boardLayout[22].icon}${boardLayout[23].icon}${boardLayout[24].icon}${boardLayout[25].icon}${boardLayout[26].icon}${boardLayout[27].icon}${boardLayout[28].icon}${boardLayout[29].icon}${boardLayout[30].icon}`,
        `${boardLayout[19].icon}⬜⬜⬜⬜⬜⬜⬜⬜⬜${boardLayout[31].icon}`,
        `${boardLayout[18].icon}⬜⬜⬜⬜⬜⬜⬜⬜⬜${boardLayout[32].icon}`,
        `${boardLayout[17].icon}⬜⬜⬜⬜⬜⬜⬜⬜⬜${boardLayout[33].icon}`,
        `${boardLayout[16].icon}⬜⬜⬜⬜⬜⬜⬜⬜⬜${boardLayout[34].icon}`,
        `${boardLayout[15].icon}⬜⬜⬜⬜⬜⬜⬜⬜⬜${boardLayout[35].icon}`,
        `${boardLayout[14].icon}⬜⬜⬜⬜⬜⬜⬜⬜⬜${boardLayout[36].icon}`,
        `${boardLayout[13].icon}⬜⬜⬜⬜⬜⬜⬜⬜⬜${boardLayout[37].icon}`,
        `${boardLayout[12].icon}⬜⬜⬜⬜⬜⬜⬜⬜⬜${boardLayout[38].icon}`,
        `${boardLayout[11].icon}⬜⬜⬜⬜⬜⬜⬜⬜⬜${boardLayout[39].icon}`,
        `${boardLayout[10].icon}${boardLayout[9].icon}${boardLayout[8].icon}${boardLayout[7].icon}${boardLayout[6].icon}${boardLayout[5].icon}${boardLayout[4].icon}${boardLayout[3].icon}${boardLayout[2].icon}${boardLayout[1].icon}${boardLayout[0].icon}`
      ];

      const Grid = board.join('\n');

      const embed = new EmbedBuilder()
        .setTitle("Monopoly Board")
        .setDescription(`\`\`\`${Grid}\`\`\``)
        .setColor("#FFFFFF");

      await interaction.followUp({ embeds: [embed] });
    } catch (error) {
      console.error('Error in command:', error);
      await interaction.followUp('There was an error while executing this command!');
    }
  },
};
