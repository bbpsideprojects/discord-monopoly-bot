const { SlashCommandBuilder,EmbedBuilder } = require('discord.js');
const { handleCardAction } = require('../utils/card_actions.js');
const { shuffleArray } = require('../utils/utils.js');
const { chanceCards, communityChestCards } = require('../utils/JSONcards.json');
const { properties, railroads, utilities } = require('../utils/JSONbuyables.json');
const { landing_events, passing_events } = require('../utils/JSONevents.json');
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
      //------------------------------------------------------------------------------
      const boardLayout = JSON.parse(JSON.stringify(require('../utils/JSONboardLayout.json')));
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
        midlayer += boardLayout[leftsideref - i].icon + whiterow + boardLayout[rightsideref - i].icon + `\n`;
      }
      const Grid = `${toplayer}\n${midlayer}${buttomlayer}`
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
