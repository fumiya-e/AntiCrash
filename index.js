const fs = require('fs');

class AntiCrash {
	constructor(mod) {
		mod.log("constructor");	
		mod.game.initialize("me");
		this.logFile = "AntiCrash_logs.txt"
		this.players = {};
		this.mod = mod;
		this.installHooks();
	}

	logMessage(msg, extraMsg, sendMessage) {
		this.mod.log(msg);

		if (sendMessage) {
			this.mod.command.message(msg);
		}

		fs.appendFile(this.logFile, "[" + (new Date().toISOString()) + "] " + msg + " " + extraMsg + "\n", function (err) {
		  if (err) throw err;
		});
	}

	stringifyBigInt(obj) {
		return JSON.stringify(obj, (key, value) =>
            typeof value === 'bigint'
                ? value.toString()
                : value
        )
	}

	destructor() {}

	installHooks() {
		this.mod.hook('S_SPAWN_USER', "*", (event) => {
			this.players[event.gameId] = {name: event.name, lastCrashAttempt: 0, countCrashAttempts: 0};
		});

		this.mod.hook("S_USER_LOCATION", "*", (event) => {
			if (event.type == 17)  {
				let now = new Date();
				let player = this.players[event.gameId];
				let timeSinceLastAttemptForPlayer = (now - player.lastCrashAttempt) / 1000;
				let shouldSendMessage = timeSinceLastAttemptForPlayer > 2;
				player.countCrashAttempts++;

				this.logMessage("Blocked crash attempt from '" + player.name + "'", "// Packet payload: " + this.stringifyBigInt(event) + " // Crash packets so far from this player: " + player.countCrashAttempts, shouldSendMessage);
				if (shouldSendMessage) { //only every 2 seconds, just so we don't spam the chat.
					player.lastCrashAttempt = new Date();
 	 			}
				return false;
			}
		});
	}

	saveState() {
		return {};
	}

	loadState(state) {}

	reset() {}
}

module.exports = {
	NetworkMod: AntiCrash,
	RequireInterface: (globalMod, clientMod, networkMod, requiredBy) => networkMod,
};