/**
 * @file Northwoods, A lightweight Bunyan-like browser logging library.
 * @version 0.0.1
 * @author Adam Mill
 * @copyright Copyright 2016 Adam Mill
 * @license Apache-2.0
 * REF: https://github.com/trentm/node-bunyan
 */
'use strict';

/**
 * The Northwoods namespace.
 * @namespace Northwoods
 */
var Northwoods = { };

/**
 * The version of the library.
 * @type {string}
 */
Northwoods.VERSION = '0.0.1';

/**
 * The version of the log format.
 * @type Number
 */
Northwoods.LOG_VERSION = 0;

/**
 * The program ID to use.
 * @type Number
 */
Northwoods.PID = 0;

/**
 * Log Levels.
 */
var TRACE	= 10;
var DEBUG	= 20;
var INFO	= 30;
var WARN	= 40;
var ERROR	= 50;
var FATAL	= 60;
Northwoods.TRACE = TRACE;
Northwoods.DEBUG = DEBUG;
Northwoods.INFO = INFO;
Northwoods.WARN = WARN;
Northwoods.ERROR = ERROR;
Northwoods.FATAL = FATAL;

/**
 * Log Level mappings.
 */
var levelFromName = {
   trace: TRACE,
   debug: DEBUG,
   info: INFO,
   warn: WARN,
   error: ERROR,
   fatal: FATAL
};
var nameFromLevel = { };
Object.keys(levelFromName).forEach(function (name) {
	nameFromLevel[levelFromName[name]] = name;
});
Northwoods.levelFromName = levelFromName;
Northwoods.nameFromLevel = nameFromLevel;

/**
 * Resolve a level number, name (upper or lowercase) to a level number value.
 * @param nameOrNum {String|Number} A level name (case-insensitive) or positive integer level.
 * @return {Number}           The resolved log level.
 */
Northwoods.resolveLevel = function resolveLever(nameOrNum) {
	const type = typeof nameOrNum;
	let level;
	if(type === 'number') {
		level = nameOrNum;
	} else if(type === 'string') {
		const levelString = nameOrNum.toLowerCase();
		level = levelFromName[levelString];
	}
	if(isNaN(level)) {
		throw new Error(`unknown log level: "${nameOrNum}" (${type})`);
	}
	return level;
};

/**
 * Create a logger.
 * @param {Object} options The options for the new logger.
 * @return {Logger} The created logger.
 */
Northwoods.createLogger = function createLogger(options) {
	return new Logger(options);
};

/**
 * Logger constructor.
 * @param {Object} options The options for the new logger.
 */
var Logger = Northwoods.Logger = function Logger(options, childOptions) {
	if(!(options && typeof options === 'object')) {
		throw new TypeError('options (object) is required');
	}
	let parent;
	if(options instanceof Logger) {
		parent = options;
		options = childOptions || { };
		childOptions = undefined;
		if('name' in options) {
			throw new TypeError('invalid options.name: child cannot set logger name');
		}
		this._parent = parent;
	} else {
		if(!(options.name && typeof options.name === 'string')) {
			throw new TypeError('options.name (string) is required');
		}
	}
	if(options.stream && options.streams) {
  	throw new TypeError('cannot mix "streams" and "stream" options');
	} else if(options.streams && !Array.isArray(options.streams)) {
		throw new TypeError('invalid options.streams: must be an array')
	} else if(options.stream) {
		this.streams = [ options.stream ];
	} else if(options.streams) {
		this.streams = options.streams;
	} else {
		this.streams = [ ];
	}
	this.src = false;
	if(parent) {
		this.streams = this.streams.concat(parent.streams);
	}
	this._level = Northwoods.resolveLevel(options.level || (parent && parent._level) || 'info');
	if(!this.streams.length) {
		this.addStream({
      type: 'raw',
      stream: new Northwoods.streamTypes.default()
		});
	}
	const fields = Object.assign({ }, parent && parent.fields, options);
  delete fields.stream;
  delete fields.level;
  delete fields.streams;
  delete fields.serializers;
	delete fields.src;
	this.fields = fields;
};

/**
 * Create a child logger.
 * @param  {Options} childOptions The additinal options for the child logger.
 * @return {Logger}         The child logger.
 */
Logger.prototype.child = function child(options) {
	return new Logger(this, options);
};

/**
 * Add a stream.
 */
Logger.prototype.addStream = function addStream(stream, defaultLevel) {
	const level = Northwoods.resolveLevel(stream.level || defaultLevel || 'info');
	if(!(stream && typeof stream === 'object')) {
		throw new TypeError('stream is required and must be an object');
	}
	if(!(stream.stream && typeof stream.stream === 'object')) {
		throw new TypeError(`Stream should be a stream instance "${typeof stream.stream}"`);
	}
	if(stream.type !== 'raw') {
		throw new Error(`Unrecognized stream type "${stream.type}"`);
	}
	const instance = {
		level,
		stream: stream.stream,
		closeOnExit: !!stream.closeOnExit,
	};
	this.streams.push(instance);
};

/**
 * Get the current time as an ISO UTC date.
 * @return {String} The formatted date.
 */
Logger.prototype._now = function _now() {
	// REF: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString
	function pad(number) {
    if (number < 10) {
      return '0' + number;
    }
    return number;
  }
	var date = new Date();
  return date.getUTCFullYear() +
    '-' + pad(date.getUTCMonth() + 1) +
    '-' + pad(date.getUTCDate()) +
    'T' + pad(date.getUTCHours()) +
    ':' + pad(date.getUTCMinutes()) +
    ':' + pad(date.getUTCSeconds()) +
    '.' + (date.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5) +
    'Z';
};

/**
 * Get the host name.
 * @return {String} The host name or a blank string if unable to determine.
 */
function getHostName() {
	if(global.location && typeof global.location.host === 'string') {
		return global.location.host;
	} else {
		return '';
	}
}

/**
 * Format a message.
 * @param  {String} value The template string.
 * @param {Array} params The template parameters.
 * @return {String}          The formatted string.
 */
Logger.prototype._format = function _format(value, params) {
	value = ''+(typeof value === 'undefined' ? '' : value);
	var idx = 0;
	value = value.replace(/%([\%sdj])/g, function(match, replace) {
		if(idx >= params.length) {
			return match;
		}
		switch(replace) {
			case '%': {
				return '%';
			}
			case 's': {
				return ''+params[idx++];
			}
			case 'd': {
				return Number(params[idx++]);
			}
			case 'j': {
				return JSON.stringify(params[idx++]);
			}
			default: {
				throw new Error(`Unrecognized format value "${match}"`);
			}
		}
	});
	return value;
}

/**
 * Create data record.
 * @param  {Number} level Log level number.
 * @param  {Object} obj   The object to log.
 * @param  {String} msg   The message to log.
 * @return {Object}       The record.
 */
Logger.prototype._record = function _record(level, obj, msg) {
	var params = Array.from(arguments);
	if(typeof obj === 'string' && typeof msg === 'undefined') {
		msg = obj;
		obj = undefined;
		if(params.length > 2) {
			params = params.slice(2);
		}
	} else {
		if(params.length > 3) {
			params = params.slice(3);
		}
	}
	var rec = {
		name: this.fields.name,
		hostname: getHostName(),
		pid: Northwoods.PID,
		level: level
	};
	rec.msg = this._format(msg, params);
	rec.time = this._now();
	rec.v = Northwoods.LOG_VERSION;
	return rec;
};
Logger.prototype._write = function _write(rec) {
	this.streams.forEach(stream => {
		stream.stream.write(rec);
	});
};
Logger.prototype._log = function _log(level, obj, msg) {
	var rec = this._record(level, obj, msg);
	this._write(rec);
};
Logger.prototype.trace = function trace(obj, msg) {
	return this._log(TRACE, obj, msg);
};
Logger.prototype.debug = function debug(obj, msg) {
	return this._log(DEBUG, obj, msg);
};
Logger.prototype.info = function info(obj, msg) {
	return this._log(INFO, obj, msg);
};
Logger.prototype.warn = function warn(obj, msg) {
	return this._log(WARN, obj, msg);
};
Logger.prototype.error = function error(obj, msg) {
	return this._log(ERROR, obj, msg);
};
Logger.prototype.fatal = function fatal(obj, msg) {
	return this._log(FATAL, obj, msg);
};

/**
 * ConsoleObjectRawStream
 */
function ConsoleObjectRawStream() {
	this._console = global.console && typeof global.console.info === 'function'
		? global.console : false;
}
ConsoleObjectRawStream.prototype.write = function write(rec) {
	if(!this._console) { return; }
	rec = rec || { };
	const level = rec && rec.level;
	if(level <= DEBUG) { // Includes TRACE
		this._console.debug(rec);
	} else if(level <= INFO) {
		this._console.info(rec);
	} else if(level <= WARN) {
		this._console.warn(rec);
	} else { // Includes ERROR & FATAL
		this._console.error(rec);
	}
};

/**
 * ConsoleSerializeRawStream
 */
function ConsoleSerializeRawStream() {
	this._console = global.console && typeof global.console.info === 'function'
		? global.console : false;
}
ConsoleSerializeRawStream.prototype.write = function write(rec) {
	if(!this._console) { return; }
	rec = JSON.stringify(rec || { });
	const level = rec && rec.level;
	if(level <= DEBUG) { // Includes TRACE
		this._console.debug(rec);
	} else if(level <= INFO) {
		this._console.info(rec);
	} else if(level <= WARN) {
		this._console.warn(rec);
	} else { // Includes ERROR & FATAL
		this._console.error(rec);
	}
};

/**
 * ConsoleFormattedRawStream
 */
function ConsoleFormattedRawStream() {
	this._console = global.console
		&& typeof global.console.info === 'function'
		? global.console
		: false;
}
ConsoleFormattedRawStream.DATAFORMAT = '\u2009·%o';
ConsoleFormattedRawStream.REMOVEKEYS = [ 'name', 'hostname', 'pid', 'level', 'msg', 'time', 'v' ];
ConsoleFormattedRawStream.prototype.write = function write(rec) {
	if(!this._console) { return; }
	rec = rec || { };
	const level = rec.level;
	const args = [ '%s', rec.msg || '' ];
	let levelName;
	if(level <= DEBUG) { // Includes TRACE
		levelName = 'debug';
	} else if(level <= INFO) {
		levelName = 'info';
	} else if(level <= WARN) {
		levelName = 'warn';
	} else { // Includes ERROR & FATAL
		levelName = 'error';
	}
	// Remove all keys that don't need to be shown...
	const data = Object.keys(rec)
		.reduce((data, key) => {
			if(!ConsoleFormattedRawStream.REMOVEKEYS.includes(key)) {
				data[key] = rec[key];
			}
			return data;
		}, { });
	// If there is any data left after filtering...
	if(Object.keys(data).length) {
		args.push(data);
		args[0] += ConsoleFormattedRawStream.DATAFORMAT;
	}
	this._console[levelName].apply(this._console, args);
};

/**
 * Stream types.
 * @type {Object}
 */
Northwoods.streamTypes = {
	ConsoleObjectRawStream,
	ConsoleSerializeRawStream,
	ConsoleFormattedRawStream
};
Northwoods.streamTypes.default = Northwoods.streamTypes.ConsoleFormattedRawStream;

/**
 * Exports.
 * @type {Object}
 */
module.exports = Northwoods;
