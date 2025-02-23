const { SlashCommandBuilder } = require('discord.js');
//------------------------------------------------------------
module.exports = {
    data: new SlashCommandBuilder()
        .setName('jaildice')
        .setDescription('"get me out mayyyyyybe"'),
//------------------------------------------------------------
    run: async ({ interaction, client }) => {
        await interaction.deferReply();
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
            //roll the dice ba-bYYYYYY-----------------------------------------------------
            let rolls = [];
            for (let i = 0; i < 2; i++) {
                const result = Math.floor(Math.random() * 6) + 1;
                rolls.push(result);
            }
            if (rolls[0] === rolls[1]) {
                player.jail = 0;
                player.contemplating_life = 0;
                player.can_move = 1;
                return interaction.editReply(`Roll double! go do crime i guess`);
            } else {
                player.contemplating_life = 0;
                return interaction.editReply(`Whoops! no double, try again later~`);

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
