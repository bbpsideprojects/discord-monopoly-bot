require('dotenv/config'); 
const { CommandKit } = require('commandkit');
const { Client, IntentsBitField} = require('discord.js');

const client = new Client ({
    //intent = what can bot ask for
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ]
})

new CommandKit({
    client,
    devGuildIds: [process.env.GUILD_ID],
    devUserIds: [process.env.USER_ID],
    eventsPath: `${__dirname}/events`,
    commandsPath: `${__dirname}/commands`,
    validationsPath: `${__dirname}/validations`,
    bulkRegister: true,
});

client.login(process.env.TOKEN);