/**
 * @file Northwoods, A lightweight Bunyan-like browser logging library.
 * @version 0.0.4
 * @author Adam Mill
 * @copyright Copyright 2016-2017 Adam Mill
 * @license Apache-2.0
 * REF: https://github.com/trentm/node-bunyan
 */
'use strict';

/**
 * The Northwoods namespace.
 * @namespace Northwoods
 */
const Northwoods = { };

/**
 * The version of the library.
 * @type {string}
 */
Northwoods.VERSION = '0.0.4';

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
const TRACE	= 10;
const DEBUG	= 20;
const INFO	= 30;
const WARN	= 40;
const ERROR	= 50;
const FATAL	= 60;
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
    if(!Northwoods._defaultStreamType) {
      throw new Error('Must setup default stream type if not specifying stream type.')
    }
		this.addStream({
      type: 'raw',
      stream: new Northwoods._defaultStreamType()
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
Logger.prototype._record = function _record(level, params) {
	var rec = {
		name: this.fields.name,
		hostname: getHostName(),
		pid: Northwoods.PID,
		level: level
	};
	var obj;
	var msg = '';
	if(params.length) {
		if(params[0] && typeof params[0] === 'object') {
			// If first is object...
			obj = params[0];
		} else if(typeof params[0] === 'string') {
			// If first is string...
			msg = params[0];
			params = params.slice(1);
		}
		if(obj && params.length > 1 && typeof params[1] === 'string') {
			// If first was object and second is string...
			msg = params[1];
			params = params.slice(2);
		}

	}
  if(obj instanceof Error) {
    obj = { err: obj };
  }
	Object.assign(rec, this.fields, obj);
	rec.msg = msg ? this._format(msg, params) : '';
	rec.time = this._now();
	rec.v = Northwoods.LOG_VERSION;
	return rec;
};
Logger.prototype.level = function level(level) {
  if(arguments.length === 0) {
    return this._level;
  } else {
    this._level = Northwoods.resolveLevel(level || 'info');
  }
};
Logger.prototype._write = function _write(rec) {
	if(rec.level >= this._level) {
		this.streams.forEach(stream => {
			stream.stream.write(rec);
		});
	}
};
Logger.prototype._log = function _log(level, params) {
	var rec = this._record(level, params);
	this._write(rec);
};
Logger.prototype.trace = function trace(obj, msg) {
	return this._log(TRACE, Array.from(arguments));
};
Logger.prototype.debug = function debug(obj, msg) {
	return this._log(DEBUG, Array.from(arguments));
};
Logger.prototype.info = function info(obj, msg) {
	return this._log(INFO, Array.from(arguments));
};
Logger.prototype.warn = function warn(obj, msg) {
	return this._log(WARN, Array.from(arguments));
};
Logger.prototype.error = function error(obj, msg) {
	return this._log(ERROR, Array.from(arguments));
};
Logger.prototype.fatal = function fatal(obj, msg) {
	return this._log(FATAL, Array.from(arguments));
};

/**
 * Default stream type.
 * @type {Object}
 */
Northwoods._defaultStreamType = null;
Northwoods.setDefaultStreamType = function setDefaultStreamType(value) {
  Northwoods._defaultStreamType = value;
}

/**
 * Exports.
 * @type {Object}
 */
module.exports = Northwoods;
