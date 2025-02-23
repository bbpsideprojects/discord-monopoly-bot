const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('oldendturn')
        .setDescription('End your turn and pass it to the next player'),

    run: async ({ interaction, client }) => {
        try {
            // Defer the reply to avoid the 3-second timeout
            await interaction.deferReply();

            // Fetch the game data from the client
            const gameID = interaction.channel.name.split('(')[1]?.split(')')[0];
            if (!gameID) {
                return await interaction.followUp('Could not find the game ID in the thread name.');
            }

            const gameData = client.games[gameID];
            if (!gameData) {
                return await interaction.followUp('Game not found or has already ended.');
            }

            const { playerStats, logChannelId, logMessageId } = gameData;

            // Find the player who invoked the command
            const player = playerStats.find(p => p.id === interaction.user.id);
            if (!player) {
                return await interaction.followUp('You are not part of this game.');
            }

            // Check if it's the player's turn
            if (player.is_turn !== 1) {
                return await interaction.followUp('It is not your turn to end.');
            }

            // Bankruptcy check: if player has no money and no properties, they are bankrupt
            if (player.money <= 0 && player.properties.length === 0) {
                // Declare bankruptcy and remove the player
                client.games[gameID].playerStats = client.games[gameID].playerStats.filter(p => p.id !== player.id);
                return await interaction.followUp(`${player.username} has been declared bankrupt and removed from the game.`);
            }

            // Prevent using /endturn if player has negative money but still has properties
            if (player.money < 0 && player.properties.length > 0) {
                return await interaction.followUp('You cannot end your turn while you have properties and negative money. Use /giveup to declare bankruptcy.');
            }

            // Set is_turn to 0 for the current player and reset move_left
            player.is_turn = 0;
            player.move_left = 0; // Reset move_left for the current player

            // Find the next player in the turn order
            const currentTurnOrder = player.turn_order;
            const nextPlayer = playerStats.find(p => p.turn_order === (currentTurnOrder % playerStats.length) + 1);

            let replyMessage = `Your turn has ended. `;

            if (nextPlayer) {
                nextPlayer.is_turn = 1; // Set is_turn to 1 for the next player
                nextPlayer.move_left = 1; // Set move_left to 1 for the next player
                nextPlayer.jail = Math.max(0, nextPlayer.jail - 1); // Reduce jail time if applicable
                replyMessage += `It is now **${nextPlayer.username}**'s turn.`;

                // Check if the next player is in jail
                if (nextPlayer.jail > 0) {
                    replyMessage += `\n**${nextPlayer.username}** is in jail! They must choose:\n`;
                    replyMessage += "1️⃣ Pay $50 to get out of jail.\n";
                    replyMessage += "2️⃣ Roll for doubles to get out of jail.\n";

                    // Check if the player has a 'Get Out of Jail Free' card
                    if (nextPlayer.cards.includes('Get Out of Jail Free')) {
                        replyMessage += "3️⃣ Use 'Get Out of Jail Free' card.\n";
                    }

                    // Create the buttons for the next player
                    const payButton = new ButtonBuilder()
                        .setCustomId('payJail')
                        .setLabel('Pay $50')
                        .setStyle(ButtonStyle.Primary);

                    const rollButton = new ButtonBuilder()
                        .setCustomId('rollDoubles')
                        .setLabel('Roll for Doubles')
                        .setStyle(ButtonStyle.Secondary);

                    const cardButton = nextPlayer.cards.includes('Get Out of Jail Free')
                        ? new ButtonBuilder()
                            .setCustomId('useCard')
                            .setLabel('Use Get Out of Jail Free Card')
                            .setStyle(ButtonStyle.Success)
                        : null;

                    // Add the buttons to an ActionRow
                    const row = new ActionRowBuilder().addComponents(payButton, rollButton);
                    if (cardButton) row.addComponents(cardButton);

                    // Send the message with buttons
                    await interaction.followUp({
                        content: replyMessage,
                        components: [row],
                        ephemeral: true,
                    });

                    // Create a collector for button interactions
                    const filter = (i) => i.user.id === nextPlayer.id;
                    const collector = interaction.channel.createMessageComponentCollector({
                        filter,
                        time: 15000, // 15 seconds to choose
                    });

                    collector.on('collect', async (i) => {
                        if (i.customId === 'payJail') {
                            nextPlayer.money -= 50; // Deduct $50 for paying out of jail
                            nextPlayer.jail = 0; // Free from jail
                            await i.reply(`${nextPlayer.username} paid $50 and is now free from jail!`);
                        } else if (i.customId === 'rollDoubles') {
                            const roll1 = Math.floor(Math.random() * 6) + 1;
                            const roll2 = Math.floor(Math.random() * 6) + 1;
                            if (roll1 === roll2) {
                                nextPlayer.jail = 0; // Free from jail
                                await i.reply(`${nextPlayer.username} rolled a double and is now free from jail!`);
                            } else {
                                await i.reply(`${nextPlayer.username} rolled **${roll1}** and **${roll2}**, but it's not a double. They stay in jail.`);
                            }
                        } else if (i.customId === 'useCard') {
                            nextPlayer.cards = nextPlayer.cards.filter(card => card !== 'Get Out of Jail Free');
                            nextPlayer.jail = 0; // Free from jail
                            await i.reply(`${nextPlayer.username} used their "Get Out of Jail Free" card and is now free from jail!`);
                        }

                        collector.stop();
                    });

                    collector.on('end', (collected, reason) => {
                        if (reason === 'time') {
                            interaction.followUp(`${nextPlayer.username} didn't choose in time! They remain in jail.`);
                        }
                    });
                }
            } else {
                replyMessage += "No next player found.";
            }

            // Update the game data in the client
            client.games[gameID].playerStats = playerStats;

            // Update the log message
            const logChannel = await client.channels.fetch(logChannelId).catch(() => null);
            if (!logChannel) return await interaction.followUp('Log channel not found.');

            let logMessage;
            try {
                logMessage = await logChannel.messages.fetch(logMessageId);
            } catch (error) {
                console.error('Error fetching log message:', error);
                return await interaction.followUp('Log message not found.');
            }

            if (!logMessage || !logMessage.edit) {
                console.error('Unable to edit log message');
                return await interaction.followUp('Unable to edit the log message.');
            }

            // Build the updated log message
            let logMessageContent = `🎲 **Monopoly Game - ${playerStats.map(p => p.username).join(' vs ')} (${gameID})**\n🏛 **Mode - Classic**\n\n`;
            playerStats.forEach((p, index) => {
                const emoji = ['🗣️', '🤓', '👶', '🥶'][index];
                logMessageContent += `👤 **${p.username}** - ${emoji}\n💰 Money - $${p.money}\n📍 At - ${p.at}\n🚔 Jail - ${p.jail}\n🏠 Properties - ${p.properties.length ? p.properties.join(', ') : 'None'}\n🎟 Cards - ${p.cards.length ? p.cards.join(', ') : 'None'}\n🎲 Turn Order - ${p.turn_order}\n🎲 Is Turn - ${p.is_turn === 1 ? 'Yes' : 'No'}\n🎲 Has Move Left - ${p.move_left === 1 ? 'Yes' : 'No'}\n🚔 Doubles Count - ${p.doubles}\n🦺 Can Build - ${player.can_build}\n\n`;
            });

            if (logMessageContent.length > 2000) {
                const parts = logMessageContent.split('\n\n');
                await logMessage.edit(parts[0]);
                await logChannel.send(parts[1]);
            } else {
                await logMessage.edit(logMessageContent);
            }

            await interaction.editReply(replyMessage);
        } catch (error) {
            console.error('Error in endturn command:', error);
            await interaction.followUp('There was an error while executing this command!');
        }
    },
};