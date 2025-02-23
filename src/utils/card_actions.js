async function handleCardAction(game, player, card, landing_event, interaction, setupChannel) {
    switch (card.action) {
        case "advanceToGo":
            player.at = 1;
            player.money += 200;
            landing_event += "Advance to Go! Collect $200.\n";
            break;
        case "collectMoney":
            player.money += card.amount;
            landing_event += `Collect $${card.amount}.\n`;
            break;
        case "payMoney":
            player.money -= card.amount;
            landing_event += `Pay $${card.amount}.\n`;
            break;
        case "goToJail":
            player.at = 11;
            player.jail = 3;
            landing_event += "Go to Jail!\n";
            break;
        case "advanceToProperty":
            player.at = card.propertyId;
            landing_event += `Advance to ${game.properties.find(p => p.id === card.propertyId).name}.\n`;
            break;
        case "advanceToNearestRailroad":
            const railroads = game.railroads.map(r => r.id);
            let nearestRailroad = railroads.find(r => r > player.at) || railroads[0]; 
            player.at = nearestRailroad;
            landing_event += `Advance to ${game.railroads.find(r => r.id === nearestRailroad).name}.\n`;
            break;
        case "advanceToNearestUtility":
            const utilities = game.utilities.map(u => u.id);
            let nearestUtility = utilities.find(u => u > player.at) || utilities[0];
            player.at = nearestUtility;
            landing_event += `Advance to ${game.utilities.find(u => u.id === nearestUtility).name}.\n`;
            break;
        case "getOutOfJailFree":
            player.cards.push("Get Out of Jail Free");
            landing_event += "Get Out of Jail Free!\n";
            break;
        case "payPerBuilding":
            const houseCount = player.properties.filter(p => p.houses > 0).length; 
            const hotelCount = player.properties.filter(p => p.hotels > 0).length;
            const totalPayment = houseCount * card.houseAmount + hotelCount * card.hotelAmount;
            player.money -= totalPayment;
            landing_event += `Pay street repairs: $${totalPayment}.\n`;
            break;
        case "payEachPlayer":
            for (const otherPlayer of game.playerStats) {
                if (otherPlayer.id !== player.id) {
                    player.money -= card.amount;
                    otherPlayer.money += card.amount;
                    landing_event += `Pay $${card.amount} to ${otherPlayer.username}.\n`;
                    if (setupChannel) {
                        await setupChannel.send(`${player.username} paid $${card.amount} to ${otherPlayer.username}.`);
                    }
                }
            }
            break;
        case "collectFromEachPlayer":
             for (const otherPlayer of game.playerStats) {
                if (otherPlayer.id !== player.id) {
                    player.money += card.amount;
                    otherPlayer.money -= card.amount;
                    landing_event += `Collect $${card.amount} from ${otherPlayer.username}.\n`;
                    if (setupChannel) {
                        await setupChannel.send(`${player.username} collected $${card.amount} from ${otherPlayer.username}.`);
                    }
                }
            }
            break;
        case "payPerHouse":
            const houseCount2 = player.properties.filter(p => p.houses > 0).length;
            const totalPayment2 = houseCount2 * card.amount;
            player.money -= totalPayment2;
            landing_event += `Pay house repairs: $${totalPayment2}.\n`;
            break;
        case "payPerHotel":
            const hotelCount2 = player.properties.filter(p => p.hotels > 0).length; 
            const totalPayment3 = hotelCount2 * card.amount;
            player.money -= totalPayment3;
            landing_event += `Pay hotel repairs: $${totalPayment3}.\n`;
            break;
        // ... other card actions
    }
}
module.exports = { handleCardAction };