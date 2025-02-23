const { SlashCommandBuilder } = require('discord.js');
//-------------------------------------------------------------------------------
module.exports = {
    data: new SlashCommandBuilder()
        .setName('endturn')
        .setDescription('End your turn and pass it to the next player'),
//-------------------------------------------------------------------------------
    run: async ({ interaction, client }) => {
        try {
            //init---------------------------------------------------------------
            await interaction.deferReply();
            const channelId = interaction.channel.id;
            const gameEntry = Object.values(client.games).find(game => game.setupChannelId === channelId);
            const gameID = gameEntry.gameID;
            const game = client.games[gameID];
            const { playerStats } = game;
            const setupChannelId = game.setupChannelId;
            const setupChannel = client.games[gameID]?.setupChannelId;
            const player = game.playerStats.find(p => p.id === interaction.user.id);
            //restriction--------------------------------------------------------
            if (!player) {
                return await interaction.followUp('You are not part of this game.');
            }
            if (player.is_turn !== 1) {
                return await interaction.followUp('It is not your turn to end.');
            }
            //bankrupt----------------------------------------------------------
            if (player.money <= 0 && player.properties.length === 0) {
                game.playerStats = game.playerStats.filter(p => p.id !== player.id);
                return await interaction.followUp(`${player.username} has been declared bankrupt and removed from the game.`);
            }
            if (player.money < 0 && player.properties.length > 0) {
                return await interaction.followUp('You cannot end your turn while you have properties and negative money. Use /giveup to declare bankruptcy.');
            }
            //end-turn----------------------------------------------------------
            player.is_turn = 0;
            player.move_left = 0;
            const currentTurnOrder = player.turn_order;
            const nextPlayer = playerStats.find(p => p.turn_order === (currentTurnOrder % playerStats.length) + 1);
            let replyMessage = `Your turn has ended. `;
            //next player pre turn----------------------------------------------
            if (nextPlayer) 
            {
                nextPlayer.is_turn = 1;
                nextPlayer.move_left = 1;
                nextPlayer.jail = Math.max(0, nextPlayer.jail - 1);
                replyMessage += `It is now **${nextPlayer.username}**'s turn.`;
                //jail time hype!?-------------------------------------------------
                if (nextPlayer.jail > 0) 
                {
                    replyMessage += `\n**${nextPlayer.username}** is in jail! They must choose:\n`;
                    replyMessage += "1️⃣ Pay $50 to get out of jail.\n";
                    replyMessage += "2️⃣ Roll for doubles to get out of jail.\n";
                    if (nextPlayer.cards.includes('Get Out of Jail Free')) {
                        replyMessage += "3️⃣ Use 'Get Out of Jail Free' card.\n";
                    }
                    replyMessage += `and no,you can't do anything until you choose :)`
                }
            }
            await interaction.reply(replyMessage);
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