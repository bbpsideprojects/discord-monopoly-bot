const { SlashCommandBuilder } = require('discord.js');
const { properties, railroads, utilities } = require('../utils/JSONbuyables.json');
//------------------------------------------------------------
module.exports = {
    data: new SlashCommandBuilder()
        .setName('buy')
        .setDescription('buy the house'),
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
            //buy---------------------------------------------------------------------------
            const current_pos = player.at;
            const landedBuyables = 
            properties.find(p => p.id === current_pos) ||
            railroads.find(p => p.id === current_pos) ||
            utilities.find(p => p.id === current_pos);
            let buymessage = ``;
            //property case----------
            if (player.money > landedBuyables.price) {
                player.money -= landedBuyables.price
                buymessage += `you buy ${landedBuyables.name}`
                if (landedBuyables.type = 'P') { 
                    player.properties.push({ name: landedBuyables.name, houses: 0, type: 'P' });
                }
                if (landedBuyables.type = 'R') { 
                    const railroadamt = player.properties.filter(p => p.type === 'R').length + 1;
                    player.properties.push({ name: landedBuyables.name, amount: railroadamt, type: 'R' });
                }
                if (landedBuyables.type = 'U') { 
                    const utilitiesamt = player.properties.filter(p => p.type === 'U').length + 1;
                    player.properties.push({ name: landedBuyables.name, amount: utilitiesamt, type: 'R' });
                }
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
