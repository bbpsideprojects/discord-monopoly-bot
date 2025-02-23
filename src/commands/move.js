const { SlashCommandBuilder } = require('discord.js');
const { handleCardAction } = require('../utils/card_actions.js');
const { shuffleArray } = require('../utils/utils.js');
const { chanceCards, communityChestCards } = require('../utils/JSONcards.json');
const { properties, railroads, utilities } = require('../utils/JSONbuyables.json');
const { landing_events, passing_events } = require('../utils/JSONevents.json');
//------------------------------------------------------------
module.exports = {
    data: new SlashCommandBuilder()
        .setName('move')
        .setDescription('Roll the dice and move your player'),
//------------------------------------------------------------
    run: async ({ interaction, client }) => {
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
            //roll & move-------------------------------------------------------------------
            const previous_pos = player.at;
            let value = 0;
            let rolls = [];
            let rollmsg = ``;
            for (let i = 0; i < 2; i++) {
                const result = Math.floor(Math.random() * 6) + 1;
                rolls.push(result);
                value += result;
            }
            if (rolls[0] === rolls[1]) {
                player.doubles += 1;
                rollmsg += `You roll double!\n`;
            } else {
                player.doubles = 0;
            }
            if (player.doubles === 3) {
                player.at = 11;
                player.doubles = 0;
                player.jail = 3;
            } else {
                player.at += value;
            }
            const diceRoll = rolls[0] + rolls[1];
            let current_pos = player.at;
            //passing events-----------------------------------------------------------------
            let passing_event = ``;
            // const passedEvent = passing_events.find(event => {
            //     const eventPos = parseInt(event.pos);
            //     return previous_pos < eventPos && eventPos < current_pos;
            // });
            // if (passedEvents.length > 0) { // Check if any events were passed
            //     for (const passedEvent of passedEvents) { // Loop through all passed events
            //         passing_event += passedEvent.text + "\n";

            //     }
            // }
            if (current_pos > 40) 
            {
                current_pos -= 40;
                player.at = current_pos;
                player.money += 200;
                passing_event += `You get $200 from the starting point!\n`
            }
            //landing events----------------------------------------------------------------
            let landing_event = ``;
            const landedEvent = landing_events.find(event => parseInt(event.pos) === current_pos);
            if (landedEvent) {
                landing_event += landedEvent.text + `\n`;
                switch (landedEvent.action) {
                    case "goToJail":
                        player.at = 11;
                        player.jail = 3;
                        landing_event += "Got sent to jail lmao\n"
                        break
                    case "communityChest":
                        if (game.communityChestCards && game.communityChestCards.length > 0) { // Check if the deck exists and is not empty
                            const randomIndex = Math.floor(Math.random() * game.communityChestCards.length);
                            const card = game.communityChestCards.splice(randomIndex, 1)[0];
                            landing_event += `Community Chest: ${card.text}\n`;
                            await handleCardAction(game, player, card, landing_event, interaction, setupChannel);
                            game.communityChestCards.push(card);
                            shuffleArray(game.communityChestCards);
                        } else {
                            console.error("Community Chest deck is empty or undefined.");
                            landing_event += "The Community Chest deck is empty.\n"; 
                        }
                        break;
                    case "chance":
                        if (game.chanceCards && game.chanceCards.length > 0) { 
                            const randomIndex = Math.floor(Math.random() * game.chanceCards.length);
                            const chanceCard = game.chanceCards.splice(randomIndex, 1)[0];
                            landing_event += `Chance: ${chanceCard.text}\n`;
                            await handleCardAction(game, player, chanceCard, landing_event, interaction, setupChannel);
                            game.chanceCards.push(chanceCard);
                            shuffleArray(game.chanceCards);
                        } else {
                            console.error("Chance deck is empty or undefined.");
                            landing_event += "The Chance deck is empty.\n"; 
                        }
                        break;
                        
                }
            }
            //buyables----------------------------------------------------------------------
            const landedBuyables = 
            properties.find(p => p.id === current_pos) ||
            railroads.find(p => p.id === current_pos) ||
            utilities.find(p => p.id === current_pos);
            let landedbuyablemessage = ``;
            //property case----------
            if (landedBuyables) 
            {
                if (landedBuyables.owner && landedBuyables.owner !== player.id)
                {
                    const owner = playerStats.find(p => p.id === landedBuyables.owner);
                    let rent = 0;
                    if (landedBuyables.type === 'P')
                    {
                        rent = landedBuyables.rent[landedBuyables.houses || 0];
                    }
                    if (landedBuyables.type === 'R')
                    {
                        const ownedrailroads = playerStats.find(p => p.id === landedBuyables.owner).properties.filter(prop => prop.type === 'R').length;
                        rent = landedBuyables.rent[ownedrailroads - 1];
                    }
                    if (landedBuyables.type === 'U')
                    {
                        const ownedutilities = playerStats.find(p => p.id === landedBuyables.owner).properties.filter(prop => prop.type === 'U').length;
                        rent = diceRoll * landedBuyables.diceMultiplier[ownedutilities - 1];
                    }
                    landedbuyablemessage += `This property is owned by ${owner.username}. You pay $${rent} rent.\n`;
                    player.money -= rent;
                    owner.money += rent;
                }else if (!landedBuyables.owner) {
                    landedbuyablemessage += `You landed on ${landedBuyables.name},you can buy it!\n`
                    player.can_buy = 1;
                } else {
                    landedbuyablemessage += `landed on ${landedBuyables.name},you can build!\n`
                    player.can_build = 1;
                }
            }
            //send some stuffs
            await interaction.reply(`${rollmsg}You rolled ${diceRoll}. You are now on space ${current_pos}\n${passing_event}${landing_event}${landedbuyablemessage}`);
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
