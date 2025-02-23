const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const { chanceCards, communityChestCards } = require('./JSONcards.json');
const { properties, railroads, utilities } = require('./JSONbuyables.json');
const { landing_events, passing_events } = require('./JSONevents.json');
const { shuffleArray } = require('../utils/utils.js');
// discord--------------------------------------------------------------------------------------------------------
module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Play Monopoly with 1 to 4 players')
    .addUserOption(option =>
      option.setName('player-1')
        .setDescription('Player 1 represented by 🗣️')
        .setRequired(true)
    )
    .addUserOption(option =>
      option.setName('player-2')
        .setDescription('Player 2 represented by 🤓')
        .setRequired(true)
    )
    .addUserOption(option =>
      option.setName('player-3')
        .setDescription('Player 3 represented by 👶')
        .setRequired(false)
    )
    .addUserOption(option =>
      option.setName('player-4')
        .setDescription('Player 4 represented by 🥶')
        .setRequired(false)
    ),
// function --------------------------------------------------------------
  run: async ({ interaction, client }) => {
    await interaction.deferReply();

    const players = [
      // get players name
      interaction.options.getUser('player-1'),
      interaction.options.getUser('player-2'),
      interaction.options.getUser('player-3'),
      interaction.options.getUser('player-4'),
    ].filter(player => player !== null); 

    const guild = interaction.guild; // server
    const roleName = "Monopoly"; // role name

    try {
      // starting embed -----------
      const embed = new EmbedBuilder()
        .setTitle('The game of Monopoly is starting!')
        .setDescription('These are the players participating today:')
        .setColor(0x00FF00)
        .setFooter({ text: 'Game is starting...' })
        .setTimestamp();
      players.forEach((player, index) => {
        const emoji = ['🗣️', '🤓', '👶', '🥶'][index];
        embed.addFields({ name: `${player.username}`, value: `As ${emoji}`, inline: true });
      });
      await interaction.editReply({ embeds: [embed] });
      //---------------------------
      
      // bot permissions-----------
      const botPermissions = interaction.channel.permissionsFor(guild.members.me);
      if (!botPermissions.has(PermissionsBitField.Flags.ManageThreads) ||
          !botPermissions.has(PermissionsBitField.Flags.SendMessagesInThreads) ||
          !botPermissions.has(PermissionsBitField.Flags.CreatePublicThreads) ||
          !botPermissions.has(PermissionsBitField.Flags.ManageRoles) ||
          !botPermissions.has(PermissionsBitField.Flags.ViewChannel)) {
        return await interaction.editReply('I do not have permission to manage threads or assign roles.');
      }
      //---------------------------

      // find & assign role-----------------
      let role = guild.roles.cache.find(r => r.name === roleName);
      for (const player of players) { // for every player in players[]
        const member = await guild.members.fetch(player.id).catch(() => null);
        if (member) {
          await member.roles.add(role).catch(error => {
            console.error(`Error assigning role to ${player.username}:`, error);
          });
        }
      }
      // -------------------------

      // inits -------------------
      const gameID = `game-${Date.now()}`;
      const playerEmojis = ['🗣️', '🤓', '👶', '🥶'];
      const playerStats = players.map((player, index) => ({ // playerstats ( important )
        id: player.id,
        username: player.username,
        icon: playerEmojis[index],
        money: 1500,
        at: 1,
        jail: 0,
        properties: [],
        cards: [],
        is_turn: index === 0 ? 1 : 0,
        move_left: index === 0 ? 1 : 0,
        can_build: 0,
        can_buy: 0,
        turn_order: index + 1,
        doubles: 0,
      }));
      
      // creating thread-------------------------------------
      for (const player of players) { // for every player in players[]
        const thread = await interaction.channel.threads.create({
          name: `${player.username}'s monitor`,
          type: ChannelType.PrivateThread,
          reason: 'Starting a game of Monopoly',
        }).catch(error => {
          console.error('Error creating thread:', error);
          return null;
        });
        if (thread) { // Check if thread creation was successful
          await thread.members.add(player.id).catch(error => {
            console.error(`Error adding ${player.username} to the thread:`, error);
          });
          await thread.send(`Welcome to the game, ${player.username}. This thread is made in case you want to keep something a secret.`); // Access username directly
        }
      }
      
      client.games = client.games || {};
      client.games[gameID] = {
        gameID,
        playerStats,
        properties, railroads, utilities,
        setupChannelId: interaction.channel.id,
        chanceCards: shuffledChanceCards,
        communityChestCards: shuffledCommunityChestCards
      };
      const firstPlayer = players[0];
      await interaction.followUp(`It's ${firstPlayer.username}'s turn!`);
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
