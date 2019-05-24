console.log("background running")

chrome.runtime.onInstalled.addListener(function (object) {
	if (object.reason === chrome.runtime.OnInstalledReason.INSTALL) {
		chrome.tabs.create({url: "/pages/options.html"});	
	}
});

var onYoutube = false;
var timeLeft = 1800;
var currentTab;
// chrome.storage.local.set({"lastDate":null}); //for debugging

checkReset();

chrome.storage.local.get({"timeLeft":timeLeft}, function(data) {
	var time = data.timeLeft;
	if (!Number.isNaN(time))
		timeLeft = time;
	else {
		chrome.storage.local.get({"timeLimit":30}, function(data) {
			timeLeft = data.timeLimit*60;
		});	
	}
});

chrome.tabs.onActivated.addListener(function(activeInfo) {
	checkReset();
	chrome.tabs.get(activeInfo.tabId, function(tab){
		currentTab = tab;
		if (isYoutube(tab.url) && !onYoutube) {
			onYoutube = true;
			startTime();
		} else if (!isYoutube(tab.url) && onYoutube) {
			onYoutube = false;
			stopTime();
		}
	});
});

chrome.tabs.onUpdated.addListener(function(tabId, changedInfo, tab) {
	console.log('tabs event received');
	checkReset();
	if(tab.active && changedInfo.url){
		currentTab = tab;
		if (isYoutube(changedInfo.url) && !onYoutube) {
			onYoutube = true;
			startTime();
		} else if (!isYoutube(changedInfo.url) && onYoutube) {
			onYoutube = false;
			stopTime();
		}
	}
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	console.log('runtime event received');
	if (request.msg == "override") {
		const minutes = request.value;
		if (minutes && minutes > 0) {
			chrome.storage.local.set({"timeLeft": minutes*60}, function() {
				timeLeft = minutes*60;
				chrome.runtime.sendMessage({
					msg: "timeLimitUpdated"
				});
				chrome.runtime.sendMessage({
					msg: "goToSavedVideo"
				});
			});
		}
	} else if (request.msg == "checkReset") {
		checkReset();
	} else if (request.msg == "timeLimitUpdated") {
		chrome.storage.local.get({"timeLeft":timeLeft}, function(data) {
			timeLeft = data.timeLeft;
		});
	}
});

function isYoutube(url) {
	// regex from https://stackoverflow.com/a/32730577
	return url.match(/(https?:\/\/(.+?\.)?youtube\.com(\/[A-Za-z0-9\-\._~:\/\?#\[\]@!$&'\(\)\*\+,;\=]*)?)/)
}

function isYoutubeVideo(url) {
	return url.match(/(https?:\/\/(.+?\.)?youtube\.com\/watch([A-Za-z0-9\-\._~:\/\?#\[\]@!$&'\(\)\*\+,;\=]*)?)/)
}

function updateTime() {
	if (timeLeft > 0) {
		timeLeft--;
	} else {
		clearInterval(timer);
		blockRedirect();
	}
	chrome.browserAction.setBadgeText({"text": formatTime(timeLeft)});
	chrome.storage.local.set({"timeLeft":timeLeft});

	var views = chrome.extension.getViews({ type: "popup" });
	if (views.length != 0) {
		chrome.runtime.sendMessage({
			msg: "updateTime", 
			time: timeLeft
		});
	}
}

function startTime() {
	chrome.browserAction.setBadgeText({"text": formatTime(timeLeft)});
	timer = setInterval(updateTime, 1000);
}

function stopTime() {
	clearInterval(timer);
	chrome.browserAction.setBadgeText({"text": ""});
}

function formatTime(totalSeconds) {
	var hours = Math.floor(totalSeconds / 3600);
	totalSeconds -= hours*3600;
	var minutes =  Math.floor(totalSeconds / 60);
	totalSeconds -= minutes*60;
	var seconds =  Math.floor(totalSeconds);

	var result = "";
	if (hours > 0) {
		result += hours + ":";
	}
	if (minutes > 0) {
		result += minutes + ":";
	} else {
		result += "0:";
	}
	if (seconds < 10) {
		result += "0";
	}
	result += seconds;

	return result;
}

function blockRedirect() {
	// console.log("blockRedirect")
	// console.log("tabs[0].url: " + currentTab)
	// console.log(isYoutubeVideo(tabs[0].url))

	if (isYoutubeVideo(currentTab.url)) {
		// request videoURL with time
		chrome.tabs.sendMessage(currentTab.id, {msg:"saveVideoURL"}, function(response){
			// console.log("response: " + response)
			chrome.storage.local.set({"savedVideoURL": response}, function() {
				chrome.tabs.update(currentTab.id, {url: "/pages/blocked.html"});
			});
		});
	} else {
		// if not on a youtube video
		chrome.storage.local.set({"savedVideoURL": currentTab.url}, function() {
			chrome.tabs.update(currentTab.id, {url: "/pages/blocked.html"});
		});
	}
}

function checkReset() {
	chrome.storage.local.get("lastDate", function(data) {
		var today = new Date();
		today.setHours(0,0,0,0);
		if (!data.lastDate || today.toString() != data.lastDate) {
			chrome.storage.local.get({"timeLimit":30}, function(data) {
				chrome.storage.local.set({"lastDate":today.toString(), "timeLeft":data.timeLimit*60}, function () {
					chrome.runtime.sendMessage({
						msg: "checkDone"
					});
				});
				timeLeft = data.timeLimit*60;
			});

		} else {
			chrome.runtime.sendMessage({
				msg: "checkDone"
			});
		}
	});
}

function urlNoTime(url) {
	let arr = url.split("&t=");
	if (arr.length >= 1) {
		return arr[0];
	}
	return null
}