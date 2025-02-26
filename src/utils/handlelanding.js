const { properties, railroads, utilities } = require('./JSONbuyables.json');
function handleLandedBuyable(player, playerStats, current_pos, diceRoll) {
    const landedBuyables = 
        properties.find(p => p.id === current_pos) ||
        railroads.find(p => p.id === current_pos) ||
        utilities.find(p => p.id === current_pos);
    let landedbuyablemessage = "";
    if (landedBuyables) {
        if (landedBuyables.owner && landedBuyables.owner !== player.id) {
            const owner = playerStats.find(p => p.id === landedBuyables.owner);
            let rent = 0;
            if (landedBuyables.type === 'P') {
                rent = landedBuyables.rent[landedBuyables.houses || 0];
            } else if (landedBuyables.type === 'R') {
                const ownedrailroads = playerStats.find(p => p.id === landedBuyables.owner).properties.filter(prop => prop.type === 'R').length;
                rent = landedBuyables.rent[ownedrailroads - 1];
            } else if (landedBuyables.type === 'U') {
                const ownedutilities = playerStats.find(p => p.id === landedBuyables.owner).properties.filter(prop => prop.type === 'U').length;
                rent = diceRoll * landedBuyables.diceMultiplier[ownedutilities - 1];
            }
            landedbuyablemessage += `This property is owned by ${owner.username}. You pay $${rent} rent.\n`;
            player.money -= rent;
            owner.money += rent;
        } else if (!landedBuyables.owner) {
            landedbuyablemessage += `You landed on ${landedBuyables.name}, you can buy it for $${landedBuyables.price}!\n`;
            player.can_buy = 1;
        } else {
            landedbuyablemessage += `You landed on ${landedBuyables.name}, you can build!\n`;
            player.can_build = 1;
        }
    }
    return landedbuyablemessage;
}

module.exports = { handleLandedBuyable };