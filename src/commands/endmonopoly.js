const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bbpclear')
    .setDescription('Clear messages or threads in the channel')
    .addSubcommand(subcommand =>
      subcommand
        .setName('messages')
        .setDescription('Delete a specified number of messages')
        .addIntegerOption(option =>
          option
            .setName('amount')
            .setDescription('Number of messages to delete (max 100)')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('threads')
        .setDescription('Delete all archived threads in the channel')
    ),

  async run(interaction) {
    console.log('Interaction received:', interaction);

    // Manual check for interaction type
    if (interaction.type !== 'APPLICATION_COMMAND') {
      console.error('Error: Interaction is not a command.');
      return;
    }

    if (!interaction.guild) {
      return interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
    }

    const member = interaction.guild.members.cache.get(interaction.user.id);
    if (!member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return interaction.reply({ content: 'You need the **Manage Messages** permission to use this command!', ephemeral: true });
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'messages') {
      const amount = interaction.options.getInteger('amount');

      if (amount < 1 || amount > 100) {
        return interaction.reply({ content: 'You can only delete between 1 and 100 messages.', ephemeral: true });
      }

      try {
        const fetched = await interaction.channel.messages.fetch({ limit: amount });
        await interaction.channel.bulkDelete(fetched, true);
        interaction.reply({ content: `Successfully deleted ${fetched.size} messages.`, ephemeral: true });
      } catch (error) {
        console.error(error);
        interaction.reply({ content: 'Failed to delete messages. Make sure they are not older than 14 days.', ephemeral: true });
      }
    } else if (subcommand === 'threads') {
      try {
        const archivedThreads = await interaction.channel.threads.fetchArchived();
        let deletedCount = 0;

        for (const [id, thread] of archivedThreads.threads) {
          await thread.delete();
          deletedCount++;
        }

        interaction.reply({ content: `Deleted ${deletedCount} archived threads.`, ephemeral: true });
      } catch (error) {
        console.error(error);
        interaction.reply({ content: 'Failed to delete threads.', esphemeral: true });
      }
    }
  },
};