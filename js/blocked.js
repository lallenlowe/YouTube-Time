chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.msg == "goToSavedVideo") {
		chrome.storage.local.get("savedVideoURL", function(data) {
			chrome.tabs.update({url: data.savedVideoURL});
		}); 
	}
});

window.password_prompt = function(label_message, button_message, timeMessage, callback) {
    const width = 300;
    const height = 200;

    const submit = function() {
        callback(input.value, timeInput.value);
        document.body.removeChild(div);
        window.removeEventListener("resize", resize, false);
    };
    var resize = function() {
        div.style.left = ((window.innerWidth / 2) - (width / 2)) + "px";
        div.style.top = ((window.innerHeight / 2) - (height / 2)) + "px";
    };

    var div = document.createElement("div");
    div.id = "password_prompt";
    div.style.background = "white";
    div.style.color = "black";
    div.style.border = "1px solid black";
    div.style.width = width + "px";
    div.style.height = height + "px";
    div.style.padding = "16px";
    div.style.position = "fixed";
    div.style.left = ((window.innerWidth / 2) - (width / 2)) + "px";
    div.style.top = ((window.innerHeight / 2) - (height / 2)) + "px";

    var label = document.createElement("label");
    label.id = "password_prompt_label";
    label.innerHTML = label_message;
    label.for = "password_prompt_input";
    div.appendChild(label);

    div.appendChild(document.createElement("br"));

    var input = document.createElement("input");
    input.id = "password_prompt_input";
    input.type = "password";
    input.addEventListener("keyup", function(e) {
        if (event.keyCode == 13) submit();
    }, false);
	div.appendChild(input);

	div.appendChild(document.createElement("br"));

	const timeLabel = document.createElement("label");
    timeLabel.id = "time_prompt_label";
    timeLabel.innerHTML = timeMessage;
    timeLabel.for = "override_minutes";
    div.appendChild(timeLabel);

	const timeInput = document.createElement('input');
	timeInput.id = 'override_minutes';
	timeInput.type = 'number';
	timeInput.min = 0;
	timeInput.max = 720;
	timeInput.addEventListener("keyup", function(e) {
        if (event.keyCode == 13) submit();
    }, false);
	div.appendChild(timeInput);
	

    div.appendChild(document.createElement("br"));
    div.appendChild(document.createElement("br"));

    var button = document.createElement("button");
    button.innerHTML = button_message;
    button.addEventListener("click", submit, false);
    div.appendChild(button);

    document.body.appendChild(div);
    window.addEventListener("resize", resize, false);
};

$("#override").click(function() {
	password_prompt("Enter Password below to add more time.", "Submit", "Enter Desired time:", (answer, minutes) => {
		if (answer === 'portlandrocks') {
			chrome.runtime.sendMessage({
				msg: "override", 
				value: minutes
			});
		}
	});
});

function isYoutubeVideo(url) {
	return url.match(/(https?:\/\/(.+?\.)?youtube\.com\/watch([A-Za-z0-9\-\._~:\/\?#\[\]@!$&'\(\)\*\+,;\=]*)?)/)
}