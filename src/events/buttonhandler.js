client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    const { customId, user } = interaction;
    const gameEntry = Object.values(client.games).find(game => game.playerStats.some(player => player.id === user.id));
    if (!gameEntry) return;

    const game = client.games[gameEntry.gameID];
    const player = game.playerStats.find(p => p.id === user.id);

    if (customId === 'jail_pay') {
        if (player.money >= 50 && player.jail > 0) {
            player.money -= 50;
            player.jail = 0;
            await interaction.update({ content: `${player.username} paid $50 to get out of jail!`, components: [] });
        } else {
            await interaction.reply({ content: "You don't have enough money or you are not in jail.", ephemeral: true });
        }
    } else if (customId === 'jail_roll') {
        if (player.jail > 0) {
            const roll1 = Math.floor(Math.random() * 6) + 1;
            const roll2 = Math.floor(Math.random() * 6) + 1;
            if (roll1 === roll2) {
                player.jail = 0;
                await interaction.update({ content: `${player.username} rolled doubles and is out of jail!`, components: [] });
            } else {
                await interaction.update({ content: `${player.username} rolled ${roll1} and ${roll2}. Still in jail.`, components: [] });
            }
        } else {
            await interaction.reply({ content: "You are not in jail.", ephemeral: true });
        }
    } else if (customId === 'jail_card') {
        if (player.cards.includes('Get Out of Jail Free') && player.jail > 0){
            player.cards = player.cards.filter(card => card !== 'Get Out of Jail Free');
            player.jail = 0;
            await interaction.update({content: `${player.username} used a get out of jail card!`, components: []});
        } else {
            await interaction.reply({content: "You don't have a get out of jail card, or are not in jail.", ephemeral: true});
        }
    }
});