const Discord = require('discord.js');
const fs = require('fs');
require('@exan/envreader').load()
const TimingService = require('@exan/timing-service')

let breadBot = new Discord.Client();

const scores = {};

if (!fs.existsSync('./data')) {
	fs.mkdirSync('./data');
}

const servers = fs.readdirSync('./data/');

servers.forEach(serverId => {
	scores[serverId] = JSON.parse(String(fs.readFileSync(`./data/${serverId}`)));
});

const timer = new TimingService.TimingService();

timer.addEvent('m', 30, 'saveToDisk');

timer.on('saveToDisk', () => {
	for (let i in scores) {
		fs.writeFileSync(`./data/${i}`, JSON.stringify(scores[i]));
	}
})

breadBot.on('ready', () => {
	console.log('Bot logged in');
});

const TIME_BEFORE_REACTION_COUNT = process.env.timebeforereactioncount * 1000 * 60;
const leaderboardSlot = process.env.amountonleaderboard

function createLeaderBoard(serverScores, message) {
	let leaderboardSpots = leaderboardSlot;

	let leaderboard = new Discord.RichEmbed().setAuthor(
		'The breadest of them all!',
		'https://cdn.discordapp.com/attachments/651081524954923028/651890139173224488/bread.png',
		'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
	).setThumbnail('https://cdn.discordapp.com/attachments/651081524954923028/651890139173224488/bread.png');

	let sortedArray = [];

	for (let i in serverScores) {
		sortedArray.push([i, serverScores[i]]);
	}

	if (sortedArray.length > 0) {
		sortedArray = sortedArray.sort(function (a, b) { return b[1] - a[1] });
	} else {
		return "There aren't any points yet!"
	}

	if (leaderboardSpots > Object.keys(serverScores).length) {
		leaderboardSpots = Object.keys(serverScores).length
	}

	const emoji = ['🥇', '🥈', '🥉']

	while (emoji.length < process.env.amountonleaderboard) {
		emoji.push(`${emoji.length + 1}th place`);
	}

    let addedMembers = 0;

	for (let i in sortedArray) {
		let userId = sortedArray[i][0];
		let breadPoints = sortedArray[i][1];

		let member = message.guild.members.find(u => u.id === userId);

        if (!member) {
            continue;
        }

        addedMembers++;

		let name = member.displayName;

		leaderboard.addField(emoji[addedMembers - 1], name, true);
		leaderboard.addBlankField(true);
		leaderboard.addField('With:', breadPoints + ' bread', true)

        if (addedMembers == leaderboardSpots) {
            break;
        }
	}

	return leaderboard
};



breadBot.on('error', (e) => { });

breadBot.on('message', async (message) => {
	if (!message.guild || !((message.channel.name && message.channel.name.toLowerCase().includes('bread')) || message.channel.name.toLowerCase().includes('🍞'))) {
		return;
	}

	if (!scores[message.guild.id]) {
		scores[message.guild.id] = {};
	}

	if (!scores[message.guild.id][message.author.id]) {
		scores[message.guild.id][message.author.id] = 0;
	}

	if (message.author.id !== breadBot.user.id) {
		let command = message.cleanContent.toLowerCase().split(' ');

		if (command[0] === '🍞') {
			switch (command[1]) {
				case 'help':
					try {
						await message.channel.send('**Commands:**\n`🍞 help` - Shows this menu\n`🍞 invite` - Invite Bread to a different server\n`🍞 top` - Display the bread leaderboard\n`🍞 me` - Display the amount of bread you\'ve collected\n`🍞 gamble %amount%` - Waste away your life savings\n`🍞 privacy` - Privacy policy');
					} catch (e) { }
				break;
				case undefined:
				case 'top':
					try {
						await message.channel.send(createLeaderBoard(scores[message.guild.id], message));
					} catch (e) { }
				break;
				case 'me':
					try {
						await message.reply(`you currently have ${scores[message.guild.id][message.author.id]} bread`);
					} catch (e) { }
				break;
				case 'gamble':
					if (!command[2]) {
						try {
							await message.reply('specify how much bread you want to gamble');
						} catch (e) { }
					} else {
						let gambleAmount = 0; 

						if (command[2] === 'all') {
							gambleAmount = scores[message.guild.id][message.author.id];
                        } else if (command[2] === 'half') {
							gambleAmount = Math.round(scores[message.guild.id][message.author.id] / 2);
                        } else {
							gambleAmount = Number(command[2]);

                            if (isNaN(gambleAmount) || 0 > gambleAmount || Math.round(gambleAmount) !== gambleAmount) {
                                await message.reply('invalid amount');

                                return;
                            } else if (gambleAmount > scores[message.guild.id][message.author.id]) {
                                await message.reply('you dont have this much bread');

                                return;
                            }
                        }
						
                        const outcome = (Math.random() <= 0.55);
                        
                        if (outcome) {
                            scores[message.guild.id][message.author.id] += gambleAmount;
                            await message.reply(`you won! You now have ${scores[message.guild.id][message.author.id]} bread!`);
                        } else {
                            scores[message.guild.id][message.author.id] -= gambleAmount;
                            await message.reply(`you lost! You now have ${scores[message.guild.id][message.author.id]} bread!`);
                        }
					}
				break;
				case 'privacy':
					try {
						await message.channel.send(
							'**Data stored**\n'
							+ 'The only data Bread (this bot) collects is how much bread (points) you have collected. '
							+ 'This data is not shared with a third party.\n\n'
							+ '**Data removal**\n'
							+ 'This data is not removed when you leave the guild you collected the bread on. '
							+ 'If your points ever show up in the leaderboard, the username displayed will be `Member has left the server`.\n\n'
							+ 'If you have any concerns and/or further questions, or want your data removed, contact me (bot owner/creator) on Github. https://github.com/Exanlv/Bread\n\n'
							+ '**Third party involvement**\n'
							+ 'This bot is hosted on a Scaleway VPS. '
							+ 'Their privacy policy may apply.\n\n'
							+ 'If requested by law enforcement, your bread scores will not be given up voluntarily.');
					} catch (e) { }
				break;
				case 'invite':
					try {
						await message.channel.send('https://discord.com/oauth2/authorize?client_id=634812523685609532&scope=bot&permissions=3136')
					} catch (e) { }
				break;
			}
		}
	}

	const reactionToUse = (message.author.username.includes('🇫🇷') || (message.member.nickname && message.member.nickname.includes('🇫🇷'))) ? '🥖' : '🍞';

	message.react(reactionToUse);
});

const events = {
	MESSAGE_REACTION_ADD: 'breadAdd',
	MESSAGE_REACTION_REMOVE: 'breadRemove',
};

breadBot.on('raw', async (event) => {
	if (!events.hasOwnProperty(event.t)) { return; }

	if (!event.d.channel_id) {
		return;
	}

	if (event.d.user_id === breadBot.user.id) {
		return;
	}

	const identifier = event.d.emoji.id ? `${event.d.emoji.name.split('~')[0]}:${event.d.emoji.id}` : event.d.emoji.name;

	const channel = breadBot.channels.find(c => c.id === event.d.channel_id);

	if (!channel || (!channel.name.toLowerCase().includes('bread') && !channel.name.includes('🍞'))) {
		return;
	}

	const message = await channel.fetchMessage(event.d.message_id);

	if ((message.createdTimestamp + TIME_BEFORE_REACTION_COUNT) < new Date().getTime()) {
		return;
	}

	const messageReaction = message.reactions.find(mr => (mr.emoji.id || mr.emoji.name) === identifier);

	if (!messageReaction.users.find(u => u.id === breadBot.user.id)) {
		return;
	}

	const shortReact = {};

	shortReact.guildId = event.d.guild_id;
	shortReact.userId = event.d.user_id;

	breadBot.emit(events[event.t], shortReact);
});

breadBot.on('breadAdd', (shortReact) => {
	if (!scores[shortReact.guildId]) {
		scores[shortReact.guildId] = {};
	}

	if (!scores[shortReact.guildId][shortReact.userId]) {
		scores[shortReact.guildId][shortReact.userId] = 0;
	}
	
	scores[shortReact.guildId][shortReact.userId]++;
});

breadBot.on('breadRemove', (shortReact) => {
	if (!scores[shortReact.guildId]) {
		scores[shortReact.guildId] = {};
	}

	if (!scores[shortReact.guildId][shortReact.userId]) {
		scores[shortReact.guildId][shortReact.userId] = 0;
	}
	
	scores[shortReact.guildId][shortReact.userId]--;
});

breadBot.login(process.env.discord_token)
