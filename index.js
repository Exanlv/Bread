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

timer.addEvent('s', 10, 'saveToDisk');

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

	if (leaderboardSlot > Object.keys(serverScores).length) {
		leaderboardSlot = Object.keys(serverScores).length
	}

	const emoji = ['🥇', '🥈', '🥉']

	while (emoji.length < process.env.amountonleaderboard) {
		emoji.push(`${emoji.length + 1}th place`);
	}

	for (i = 0; i < leaderboardSlot; i++) {
		let userId = sortedArray[i][0];
		let breadPoints = sortedArray[i][1];

		let member = message.guild.members.find(u => u.id === userId);

		let name = member ? member.displayName : 'Member has left the server';

		leaderboard.addField(emoji[i], name, true);
		leaderboard.addBlankField(true);
		leaderboard.addField('With:', breadPoints + ' amount of bread', true)
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
						await message.channel.send('**Commands:**\n`🍞 help` - Shows this menu\n`🍞 top` - Display the bread leaderboard\n`🍞 me` - Display the amount of bread you\'ve collected');
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
			}
		}
	}

	const reactionToUse = (message.author.username.includes('🇫🇷') || (message.member.nickname && message.member.nickname.includes('🇫🇷'))) ? '🥖' : '🍞';

	message.react(reactionToUse);

	const reaction = (await message.awaitReactions((reaction, user) => reaction.emoji.name === reactionToUse, {
		time: TIME_BEFORE_REACTION_COUNT
	})).first();

	if (!scores[message.guild.id]) {
		scores[message.guild.id] = {};
	}

	reaction.users.tap((user) => {
		if (user.bot) {
			return;
		}

		if (!scores[message.guild.id][user.id]) {
			scores[message.guild.id][user.id] = 0;
		}

		scores[message.guild.id][user.id]++;
	});
});

breadBot.login(process.env.discord_token)