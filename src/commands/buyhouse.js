const { SlashCommandBuilder } = require('discord.js');
const { handleCardAction } = require('../utils/card_actions.js');
const { shuffleArray } = require('../utils/utils.js');
const { chanceCards, communityChestCards } = require('../utils/JSONcards.json');
const { properties, railroads, utilities } = require('../utils/JSONbuyables.json');
const { landing_events, passing_events } = require('../utils/JSONevents.json');
//------------------------------------------------------------
module.exports = {
    data: new SlashCommandBuilder()
        .setName('buy!')
        .setDescription('buy the housewq'),
//------------------------------------------------------------
    run: async ({ interaction, client }) => {
        try {
            //inits-------------------------------------------------------------------------
            const channelId = interaction.channel.id;
            const gameEntry = Object.values(client.games).find(game => game.setupChannelId === channelId);
            const gameID = gameEntry.gameID;
            const game = client.games[gameID];
            const player = game.playerStats.find(p => p.id === interaction.user.id);
            //restrict--------
            if (player.can_buy !== 1) {
                return interaction.reply("You cant buy!");
            }
            //roll & move-------------------------------------------------------------------
            const landedBuyables = 
            properties.find(p => p.id === current_pos) ||
            railroads.find(p => p.id === current_pos) ||
            utilities.find(p => p.id === current_pos);
            let buymessage = ``;
            //property case----------
            if (player.money > landedBuyables.price) {
                player.money -= landedBuyables.price
                buymessage += `you buy ${landedBuyables.name}`
            } else {
                buymessage += `not enough money to buy ${landedBuyables.name}`
            }
            player.can_buy = 0;
            //send some stuffs
            await interaction.reply(`${buymessage}`);
        //boring part---------------------------------------------------------------
        } catch (error) {
            console.error('Error in command:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply('There was an error while executing this command!');
            } else {
                await interaction.followUp('There was an error while executing this command!');
            }
        }
    },
};
