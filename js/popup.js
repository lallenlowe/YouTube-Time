chrome.runtime.sendMessage({
	msg: "checkReset"
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.msg == "checkDone") {
		chrome.storage.local.get("timeLeft", function(data) {
			$("#time").text(formatTime(data.timeLeft) + " remaining")
		});
	}
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.msg == "updateTime") {
		$("#time").text(formatTime(request.time) + " remaining");
	}
});

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