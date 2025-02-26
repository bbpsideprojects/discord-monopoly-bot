const { SlashCommandBuilder,EmbedBuilder } = require('discord.js');
const { properties, railroads, utilities } = require('../utils/JSONbuyables.json');
//------------------------------------------------------------
module.exports = {
  data: new SlashCommandBuilder()
    .setName('boardstate')
    .setDescription('View the current state of the Monopoly board'),
//------------------------------------------------------------
  run: async ({ interaction, client }) => {
    await interaction.deferReply();
    try {
      //inits-------------------------------------------------------------------------
      const channelId = interaction.channel.id;
      const gameEntry = Object.values(client.games).find(game => game.setupChannelId === channelId);
      const gameID = gameEntry.gameID;
      const game = client.games[gameID];
      const { playerStats } = game;
      const setupChannelId = game.setupChannelId;
      const setupChannel = client.games[gameID]?.setupChannelId;
      const player = game.playerStats.find(p => p.id === interaction.user.id);
      const boardLayout = JSON.parse(JSON.stringify(require('../utils/JSONboardLayout.json')));
      //change board------------------------------------------------------------
      //owned properties-------------------------
      const propertyPositions = {};
      [...properties, ...railroads, ...utilities].forEach(prop => {
        propertyPositions[prop.name] = prop.position;
      });
      playerStats.forEach(player => {
        player.properties?.forEach(propertyName => {
          const position = propertyPositions[propertyName];
          if (position !== undefined) {
            const space = boardLayout.find(space => space.pos === position);
            if (space) {
              space.icon = `🔶`;
            }
          }
        })       
      })
      //players----------------------------------
      const playerPositions = [];
      playerStats.forEach(player => {
        const position = player.at;
        if (position !== undefined) {
          playerPositions.push({
            position: position,
            icon: player.icon,
          })
        }

      })
      for (let i = 0; i < playerPositions.length; i++) {
        let repeat = 0;
        for (let j = 0; j < playerPositions.length; j++) {
          if (playerPositions[i].position === playerPositions[j].position) {
            repeat++;
          }
        }
        switch (repeat) {
          case 1:
            const spaceIndex1 = boardLayout.findIndex(space => space.pos === playerPositions[i].position);
            if(spaceIndex1 !== -1){
              boardLayout[spaceIndex1].icon = playerPositions[i].icon;
              break;
            }
          case 2:
            const spaceIndex2 = boardLayout.findIndex(space => space.pos === playerPositions[i].position);
            if(spaceIndex2 !== -1){
              boardLayout[spaceIndex2].icon = `2️⃣`;
            }
            break;
          case 3:
            const spaceIndex3 = boardLayout.findIndex(space => space.pos === playerPositions[i].position);
            if(spaceIndex3 !== -1){
              boardLayout[spaceIndex3].icon = `3️⃣`;
            }
            break;
          case 4:
            const spaceIndex4 = boardLayout.findIndex(space => space.pos === playerPositions[i].position);
            if(spaceIndex4 !== -1){
              boardLayout[spaceIndex4].icon = `4️⃣`;
            }
            break;
        }
      }
      //draw board--------------------------------------------------------------------
      const lastSpace = boardLayout[boardLayout.length - 1];
      if (!lastSpace || lastSpace.pos === undefined) {
        console.error("Error: Last space in boardLayout is invalid.");
        return null; // Return null to indicate an error
      }
      const spacenum = boardLayout[boardLayout.length - 1].pos;
      const sidenum = (spacenum / 4) + 1;
      const midlayernum = sidenum - 2
      let toplayer = ``;
      for (let i = (sidenum - 1) * 2; i < (sidenum - 1) * 3 + 1; i++) {
        toplayer += boardLayout[i].icon
      }
      let buttomlayer = ``;
      for (let i = (sidenum) - 1; i > -1; i--) {
        buttomlayer += boardLayout[i].icon
      }
      let midlayer = ``;
      let whitespace = `⬜`;
      let leftsideref = (sidenum - 1) * 2;
      let rightsideref = (sidenum - 1) * 3;
      let whiterow = whitespace.repeat(midlayernum);
      for (let i = 1; i < midlayernum + 1; i++)
      {
        midlayer += boardLayout[leftsideref - i].icon + whiterow + boardLayout[rightsideref + i].icon + `\n`;
      }
      //embed-------------------------------------------------------------------
      const Grid = `${toplayer}\n${midlayer}${buttomlayer}`
      const embed = new EmbedBuilder()
        .setTitle("Monopoly Board")
        .setDescription(`\`\`\`${Grid}\`\`\``)
        .setColor("#FFFFFF");

      await interaction.followUp({ embeds: [embed] });
      //nerd part----------------------------------------------------------------
    } catch (error) {
      console.error('Error in command:', error);
      await interaction.followUp('There was an error while executing this command!');
    }
  },
};
