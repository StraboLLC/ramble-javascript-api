"use strict";
S.Util = {
	pointsToLatLngs: function(points) {
		var results = [];
		for (var x in points) {
			results.push(new L.LatLng(points[x].coords[0], points[x].coords[1]));
		}
		return results;
	},
	videoURL: function(token) {
		return S.Config.MEDIA_URL + "/" + token + "/" + token;
	},
	createVideo: function(token) {
		var video = document.createElement('video');
		video.autoplay = false;
		if (video.canPlayType('video/webm')) video.src = S.Util.videoURL(token) + ".webm";
		else if (video.canPlayType('video/mp4')) video.src = S.Util.videoURL(token) + ".mp4";
		else if (video.canPlayType('video/ogg')) video.src = S.Util.videoURL(token) + ".ogg";
		else video.innerHTML = S.ERROR_CANNOT_PLAY_TYPE;
		video.controls = "controls";
		return video;
	},
	ERROR_CANNOT_PLAY_TYPE: "Sorry, your browser cannot play HTML5 Video. Please try using <a href='http://google.com/chrome'>Google Chrome</a> for best results",
	ERROR_NOT_VIDEO: "This method can only be called on video typed rambles.",
	ERROR_NOT_PHOTO: "This method can only be called on photo typed rambles."
};
