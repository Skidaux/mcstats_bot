const { Client, MessageEmbed, MessageAttachment } = require('discord.js');
const util = require('minecraft-server-util');
require('dotenv').config();

const bot = new Client({ intents: ["GUILDS", "GUILD_MESSAGES"] });

bot.on('ready', () => {
  console.log('Bot is ready!');
});

bot.on('messageCreate', async (msg) => {
  if (msg.content.startsWith('!ping')) {
    const args = msg.content.split(' ');
    if (args.length < 3 || args.length > 5) {
      msg.channel.send('Invalid command. Usage: !ping [server-type] [ip-address] (-p port)');
      return;
    }

    const serverType = args[1].toLowerCase();
    const ipAddress = args[2];
    let port;

    if (serverType === 'java') {
      port = args.length === 5 && args[3] === '-p' ? parseInt(args[4]) : 25565;
    } else if (serverType === 'bedrock') {
      port = args.length === 5 && args[3] === '-p' ? parseInt(args[4]) : 19132;
    } else {
      msg.channel.send('Invalid server type specified. Please use either "java" or "bedrock".');
      return;
    }

    if (isNaN(port)) {
      msg.channel.send('Invalid port number specified.');
      return;
    }

    try {
      let response;
      if (serverType === 'java') {
        response = await util.status(ipAddress, port);
      } else if (serverType === 'bedrock') {
        response = await util.statusBedrock(ipAddress, port);
      }

      const { motd, players, version, favicon } = response;

      const embed = new MessageEmbed()
        .setTitle(`🟢 Server Status - ${ipAddress}`)
        .setColor(0x0099ff)
        .addField('Server MOTD', motd.clean, false)
        .addField('Online Players', players.online.toString(), true)
        .addField('Max Players', players.max.toString(), true)
        .addField('Server Version', JSON.stringify(version), true);

      if (favicon) {
        const base64Image = favicon.split(",")[1];
        const imageBuffer = Buffer.from(base64Image, 'base64');
        
        const attachment = new MessageAttachment(imageBuffer, 'image.png');
        const attachmentMessage = await msg.channel.send({ files: [attachment] });
        const imageUrl = attachmentMessage.attachments.first().url;
      
        embed.setImage(imageUrl);
        attachmentMessage.delete();
      }

      msg.channel.send({ embeds: [embed] });

    } catch (error) {
      console.error('Error getting server status', error);
      msg.channel.send('Server is offline or unreachable.');
    }
  }
});

bot.login(process.env.DISCORD_BOT_TOKEN);