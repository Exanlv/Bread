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



function createLeaderBoard(serverScores, message, slots = leaderboardSlot) {
	slots = slots > 20 ? slots = 20 : slots;
	let leaderboardSpots = slots;

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

	while (emoji.length < leaderboardSlot) {
		emoji.push(`${emoji.length + 1}th place`);
	}

	for (let i = 0; i < leaderboardSpots; i++) {
		let userId = sortedArray[i][0];
		let breadPoints = sortedArray[i][1];

		let member = message.guild.members.find(u => u.id === userId);

		let name = member ? member.displayName : 'Member has left the server';

		leaderboard.addField(emoji[i], name, true);
		leaderboard.addField('With:', breadPoints + ' bread', true);
		leaderboard.addBlankField(true);
	}

	return leaderboard
};

function wherePlain(serverScores, message) {
	let sortedArray = [];
	let breadPoints = scores[message.guild.id][message.author.id]

	for (let i in serverScores) {
		sortedArray.push([i, serverScores[i]]);
	}

	if (sortedArray.length > 0) {
		sortedArray = sortedArray.sort(function (a, b) { return b[1] - a[1] });
	} else {
		return "There aren't any points yet!"
	}

	searcharg = [[message.author.id, scores[message.guild.id][message.author.id]]]


	let position = 0

	for (let i = 0; i < sortedArray.length; i++) {
		if (sortedArray[i].toString() == searcharg.toString()) {
			position = i
		}
	}

	const emoji = ['🥇', '🥈', '🥉',]

	while (emoji.length < position + 1) {
		emoji.push(`${emoji.length + 1}th place`);
	}

	return `You have ${breadPoints} bread, which makes you ${emoji[position]}`


}



function where(serverScores, message, mentioned = false) {
	let leaderboard = new Discord.RichEmbed().setAuthor(
		'The breadest of them all!',
		'https://cdn.discordapp.com/attachments/651081524954923028/651890139173224488/bread.png',
		'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
	)

	let sortedArray = [];


	for (let i in serverScores) {
		sortedArray.push([i, serverScores[i]]);
	}

	if (sortedArray.length > 0) {
		sortedArray = sortedArray.sort(function (a, b) { return b[1] - a[1] });
	} else {
		return "There aren't any points yet!"
	}



	let searcharg = []

	if (mentioned) {
		let mentionedUsers = message.mentions.users.array()
		if (mentionedUsers.length > 8) {
			return "That\'s way too many people"
		}
		for (let i = 0; i < mentionedUsers.length; i++) {
			searcharg.push([mentionedUsers[i].id, scores[message.guild.id][mentionedUsers[i].id]])
			if (searcharg[i][1] === undefined) {
				scores[message.guild.id][mentionedUsers[i].id] = 0
				searcharg[i][1] = 0
			}
		}
	} else { searcharg = [[message.author.id, scores[message.guild.id][message.author.id]]] }

	if (searcharg.length > 0) {
		searcharg = searcharg.sort(function (a, b) { return b[1] - a[1] });
	} else {
		return "User was not found"
	}




	for (let k = 0; k < searcharg.length; k++) {
		let breadPoints = searcharg[k][1]
		let position = 0

		for (let i = 0; i < sortedArray.length; i++) {
			if (sortedArray[i].toString() == searcharg[k].toString()) {
				position = i
			}
		}

		const emoji = ['🥇', '🥈', '🥉',]

		while (emoji.length < position + 1) {
			emoji.push(`${emoji.length + 1}th place`);
		}

		let member = message.guild.members.find(u => u.id === searcharg[k][0]);
		let name = member ? member.displayName : 'Member has left the server'
		leaderboard.addField(emoji[position], name, true);
		leaderboard.addField('With:', breadPoints + ' bread', true);
		leaderboard.addBlankField(true);
	}
	return leaderboard
}



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
						await message.channel.send('**Commands:**\n`🍞 ` - Displayes the B R E A D L E A D E R B O A R D\n`🍞 help` - Shows this menu\n`🍞 top` - Display the bread leaderboard. You can specify how many people you would like to see\n`🍞 me` - Display the amount of bread you\'ve collected and your position\n`🍞 position` - Shows your current position in a leaderboard style or the mentioned user(s)\n`🍞 @` - Shows the mentioned user(s) on the leaderboard ');
					} catch (e) { }
					break;
				case undefined:
				case 'top':
					try {
						if (!command[2]) {
							await message.channel.send(createLeaderBoard(scores[message.guild.id], message));
						} else {
							await message.channel.send(createLeaderBoard(scores[message.guild.id], message, command[2]));
						}
					} catch (e) { }
					break;
				case 'me':
					try {
						await message.reply(wherePlain(scores[message.guild.id], message));
					} catch (e) { }
					break;
				case 'position':
					try {
						if (command[2] && command[2].includes('@')) {
							await message.channel.send(where(scores[message.guild.id], message, true));
						} else { await message.channel.send(where(scores[message.guild.id], message)); }
					} catch (e) { }
					break
			}

			try {
				if (command[1].includes('@')) {
					await message.channel.send(where(scores[message.guild.id], message, true));
				}
			} catch (e) { }

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