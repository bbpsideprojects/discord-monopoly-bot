const { SlashCommandBuilder } = require('discord.js');
//------------------------------------------------------------
module.exports = {
    data: new SlashCommandBuilder()
        .setName('getmeout')
        .setDescription('"get me out please!"'),
//------------------------------------------------------------
    run: async ({ interaction, client }) => {
        try {
            //inits-------------------------------------------------------------------------
            const channelId = interaction.channel.id;
            const gameEntry = Object.values(client.games).find(game => game.setupChannelId === channelId);
            const gameID = gameEntry.gameID;
            const game = client.games[gameID];
            const player = game.playerStats.find(p => p.id === interaction.user.id);
            //why--------------------------------------------------------------------------
            if (player.contemplating_life !== 0) {
                return interaction.editReply(`why are you using these broski`);
            }
            //THE card---------------------------------------------------------------------
            const cardIndex = player.cards.indexOf('Get Out of Jail Free');
            if (cardIndex !== -1) {
            player.cards.splice(cardIndex, 1);
            player.jail = 0;
            player.contemplating_life = 0;
            player.can_move = 1;
            return interaction.editReply('You used your Get Out of Jail Free card and are now free!');
            } else  
            {
            //beta male way smh--------------------------------------------------------------    
            const jailFee = 50; 
            if (player.money >= jailFee) 
            {
                player.money -= jailFee;
                player.jail = 0;
                player.contemplating_life = 0;
                player.can_move = 1;
                return interaction.editReply(`You paid $${jailFee} to get out of jail.`);
            } else 
            {
                return interaction.editReply(`You do not have enough money to pay the $${jailFee} jail fee.`);
            }
            }  
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
