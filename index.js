const Discord = require('discord.js');
const fs = require('fs');
require('@exan/envreader').load()
const TimingService = require('@exan/timing-service')

let breadBot = new Discord.Client();

const scores = {};


const servers = fs.readdirSync('./data/');

servers.forEach(serverId => {
	scores[serverId] = JSON.parse(String(fs.readFileSync(`./data/${serverId}`)));
});

const timer = new TimingService.TimingService();

timer.addEvent('s', 30, 'saveToDisk');

timer.on('saveToDisk', () => {
	for (let i in scores) {
		fs.writeFileSync(`./data/${i}`, JSON.stringify(scores[i]));
	}
})

breadBot.on('ready', () => {
	console.log('Bot logged in');
});

const TIME_BEFORE_REACTION_COUNT = process.env.timebeforereactioncount //* 1000 * 60;
leaderboardSlot = process.env.amountonleaderboard

function createLeaderBoard(json, message) {
	leaderboard = new Discord.RichEmbed().setAuthor('The breadest of them all!', 'https://cdn.discordapp.com/attachments/651081524954923028/651890139173224488/bread.png', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
	var sortedArray = [];

	for (var i in json) {
		sortedArray.push([i, json[i]]);
	}

	console.log(sortedArray)

	if (sortedArray.length > 0) {
		sortedArray = sortedArray.sort(function (a, b) { return b[1] - a[1] });
	} else {
		return "There aren't any points yet!"
	}

	if (leaderboardSlot > Object.keys(json).length) {
		leaderboardSlot = Object.keys(json).length
	}

	for (i = 0; i < leaderboardSlot; i++) {
		userId = sortedArray[i][0];
		breadPoints = sortedArray[i][1];

		let member = message.guild.members.find(u => u.id === userId);

		console.log(i)
		emoji = ['🥇', '🥈', '🥉']

		if (i < 4) {
			emoji = emoji[i]
		} else {
			emoji = 'in ' + i + 'th place'
		}
		console.log(emoji)
		name = member.displayName;

		leaderboard.addField(emoji, name, true);
		leaderboard.addBlankField(true);
		leaderboard.addField('With:', breadPoints + ' amount of bread', true)


	}

	return leaderboard


};



breadBot.on('error', (e) => { });

breadBot.on('message', async (message) => {
	if (!((message.channel.name && message.channel.name.toLowerCase().includes('bread')) || message.channel.name.toLowerCase().includes('🍞'))) {
		return;
	}

	const reactionToUse = (message.author.username.includes('🇫🇷') || (message.member.nickname && message.member.nickname.includes('🇫🇷'))) ? '🥖' : '🍞';

	message.react(reactionToUse);







	filter = (reaction, user) => {
		return (reaction.emoji.name === '🍞' || reaction.emoji.name === '🥖')
	};


	if (message.author.id !== breadBot.user.id)
		if (message.content.toLowerCase().startsWith('🍞board') || message.content.toLowerCase().startsWith('breadboard')) {
			if (message.content.toLowerCase().includes('help')) {
				messagecollection = true
				message.channel.send("**b r e a d** \nPrints the amount of bread you have collected")
			}
			else {

				message.channel.send(createLeaderBoard(scores[message.guild.id], message))


			}
		}

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