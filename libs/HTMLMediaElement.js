/**
 * @class HTMLMediaElement
 * HTML media elements (such as <audio> and <video> ) have properties and methods common to both <audio> and <video>.
 */

/**
 * @property autoplay
 * @type {Boolean}
 * Reflects the autoplay HTML attribute, indicating whether playback should automatically begin as soon as enough media is available to do so without interruption.
 */


/**
 * @property buffered
 * @type {TimeRanges}
 * The ranges of the media source that the browser has buffered (if any) at the moment the buffered property is accessed. The returned TimeRanges object is normalized. Read only. 
 */
/**
 * @property controls
 * @type {Boolean}
 * Reflects the controls HTML attribute, indicating whether user interface items for controlling the resource should be displayed. 
 */
/**
 * @property currentSrc
 * @type {String}
 * The absolute URL of the chosen media resource (if, for example, the server selects a media file based on the resolution of the user's display), or an empty string if the networkState is EMPTY. Read only. 
 */
/**
 * @property currentTime
 * @type {Number}
 * The current playback time, in seconds. Setting this value seeks the media to the new time. 
 */
/**
 * @property defaultMuted
 * @type {Boolean}
 * Reflects the muted HTML attribute, indicating whether the media element's audio output should be muted by default. This property has no dynamic effect, to mute and unmute the audio output, use the muted property. 
 */
/**
 * @property defaultPlaybackRate
 * @type {Number}
 * The default playback rate for the media. 1.0 is "normal speed," values lower than 1.0 make the media play slower than normal, 
 * higher values make it play faster. The value 0.0 is invalid and throws a NOT_SUPPORTED_ERR exception. Unimplemented (see bug 495040 )
 */

/**
 * @property duration
 * @type {Number}
 * The length of the media in seconds, or zero if no media data is available.  If the media data is available but the length is unknown, this value is NaN.  If the media is streamed and has no predefined length, the value is Inf. Read only. 
 */
/**
 * @property ended
 * @type {Boolean}
 * Indicates whether the media element has ended playback. Read only. 
 */
/**
 * @property initialTime
 * @type {Number}
 * The initial playback position in seconds. Read only. 
 */
/**
 * @property loop
 * @type {Boolean}
 * Reflects the loop HTML attribute, indicating whether the media element should start over when it reaches the end. 
 */
/**
/**
 * @property muted
 * @type {Boolean}
 * true if the audio is muted, and false otherwise. 
 */

/**
 * @property networkState
 * @type {Number}
 * The current state of fetching the media over the network. 
 * NETWORK_EMPTY			0	There is no data yet.  The readyState is also HAVE_NOTHING.
 * NETWORK_IDLE				1	 
 * NETWORK_LOADING			2	The media is loading.
 * NETWORK_NO_SOURCE [NETWORK_LOADED]	3	 
 * 
 */
/**
 * @property paused
 * @type {Boolean}
 * Indicates whether the media element is paused. Read only. 
 */
/**
 * @property playbackRate
 * @type {Number}
 * The current rate at which the media is being played back. This is used to implement user controls for fast forward, slow motion, and so forth. The normal playback rate is multiplied by this value to obtain the current rate, so a value of 1.0 indicates normal speed. Unimplemented (see bug 495040 ) 
 */
/**
 * @property played
 * @type {TimeRanges}
 * The ranges of the media source that the browser has played, if any. Read only. 
 */
/**
 * @property preload
 * @type {String}
 * Reflects the preload HTML attribute, indicating what data should be preloaded, if any. 
 * Possible values are: "none", "metadata", "auto". See preload attribute documentation for details.
 * Replaced the autobuffer property in Gecko 2.0 (Firefox 4 / Thunderbird 3.3 / SeaMonkey 2.1) .
 */

/**
 * @property readyState
 * @type {Number}
 * #Description 
 * readyState		unsigned short	
 * The readiness state of the media. Read only.
 * 
 * HAVE_NOTHING			0	No information is available about the media resource.
 * HAVE_METADATA		1	Enough of the media resource has been retrieved that the metadata attributes are initialized.  Seeking will no longer raise an exception.
 * HAVE_CURRENT_DATA	2	Data is available for the current playback position, but not enough to actually play more than one frame.
 * HAVE_FUTURE_DATA		3	Data for the current playback position as well as for at least a little bit of time into the future is available (in other words, at least two frames of video, for  * example).
 */
/**
 * @property seekable
 * @type {TimeRanges}
 * The time ranges that the user is able to seek to, if any. Read only. 
 */
/**
 * @property seeking
 * @type {Boolean}
 * Indicates whether the media is in the process of seeking to a new position. Read only. 
 */
/**
 * @property src
 * @type {String}
 * Reflects the src HTML attribute, containing the URL of a media resource to use. 
 */
/**
 * @property startOffsetTime
 * @type {Date}
 * Unimplemented (see bug 498253 ) 
 */
/**
 * @property volume
 * @type {Number}
 * The audio volume, from 0.0 (silent) to 1.0 (loudest). 
 */

/**
 * @method canPlayType
 * Determines whether the specified media type can be played back.
 * @param {String} type Type of video to check for.
 * @return {String} Probably/Maybe/""
 */
/**
 * @method load
 * Begins loading the media content from the server.
 * @return {void}
 */
/**
 * @method pause
 * Pauses the media playback.
 * @return {void}
 */

/**
 * @method play
 * Begins playback of the media. If you have changed the src attribute of the media element since the page was loaded, 
 * you must call load() before play(), otherwise the original media plays again.
 * @return {void}
 */