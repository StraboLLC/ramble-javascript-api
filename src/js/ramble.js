"use strict";
/**
 * Global Namespace for all Strabo Ramble related API Functions.
 * @type {Object}
 */
var S = {
	currentResponse:null,
	currentRamble:null,
	setCurrentResponse:function(response) {
		this.currentResponse=response;
	}
};
/**
 * Namespace for Important Constants
 * @type {Object}
 */
S.Config = {
	SITE_BASE_URL: "/",
	MEDIA_URL: "/data" 
	// MEDIA_URL: "http://ns.data.api.strabo.co.s3-website-us-east-1.amazonaws.com"
};