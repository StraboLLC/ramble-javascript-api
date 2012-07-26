"use strict";

var S = {
	rambles:[],
	currentResponse:null,
	currentRamble:null,
	setCurrentResponse:function(response) {
		this.currentResponse=response;
	},
	version:"0.1.0"
};

S.Config = {
	SITE_BASE_URL: "/",
	MEDIA_URL: "/data" 
	// MEDIA_URL: "http://ns.data.api.strabo.co.s3-website-us-east-1.amazonaws.com"
};