/**
 * test/northwoodsSpec.js
 */
'use strict';

/**
 * Imports.
 */
const expect = require('expect.js');
const sinon = require('sinon');
const Northwoods = require('../index');

/**
 * Tests.
 */
describe('Northwoods', () => {
	describe('Logger', () => {
		it('should be a class', () => {
			expect(Northwoods.Logger).to.be.a('function');
			expect(Northwoods.Logger.length).to.be(2);
		});
		describe('instance', () => {
			it('should be able to create an instance', () => {
				const log = new Northwoods.Logger({ name: 'test123', when: 'when?!' });
				expect(log).to.be.a(Northwoods.Logger);
				expect(log.fields).to.be.an('object');
				expect(log.fields.name).to.be('test123');
				expect(log.fields.when).to.be('when?!');
				expect(log._level).to.be(Northwoods.INFO);
				expect(log._parent).to.be(undefined);
				expect(log.streams.length).to.be(1);
			});
			it('should handle numeric log levels', () => {
				const log = new Northwoods.Logger({ name: 'test123', level: 40 });
				expect(log).to.be.a(Northwoods.Logger);
				expect(log._level).to.be(Northwoods.WARN);
			});
			it('should throw if not given options', () => {
				expect(() => {
					new Northwoods.Logger();
				}).to.throwException(/options \(object\) is required/i);
			});
			it('should throw if not given a name', () => {
				expect(() => {
					new Northwoods.Logger({ });
				}).to.throwException(/options.name \(string\) is required/i);
			});
		})
		describe('child()', () => {
			it('should create a child logger', () => {
				const log = new Northwoods.Logger({ name: 'test123', when: 'when!?' });
				const child = log.child({ what: 'what?!' });
				expect(child).to.be.a(Northwoods.Logger);
				expect(child.fields).to.not.be(log.fields);
				expect(child.fields).to.be.an('object');
				expect(child.fields.name).to.be('test123');
				expect(child.fields.when).to.be('when!?');
				expect(child.fields.what).to.be('what?!');
				expect(child._level).to.be(Northwoods.INFO);
				expect(child._parent).to.be(log);
				expect(child.streams.length).to.be(1);
				expect(log.fields.what).to.be(undefined);
			});
			it('should inherit log level', () => {
				const log = new Northwoods.Logger({ name: 'test123', level: 'debug' });
				expect(log._level).to.be(Northwoods.DEBUG);
				const child = log.child();
				expect(child._level).to.be(Northwoods.DEBUG);
			});
			it('should override log level', () => {
				const log = new Northwoods.Logger({ name: 'test123', level: 'debug' });
				expect(log._level).to.be(Northwoods.DEBUG);
				const child = log.child({ level: 'info' });
				expect(child._level).to.be(Northwoods.INFO);
			});
			it('should throw if child is given a name', () => {
				expect(() => {
					const log = new Northwoods.Logger({ name: 'test123' });
					expect(log).to.be.a(Northwoods.Logger);
					expect(log.fields.name).to.be('test123');
					log.child({ name: 'child123' });
				}).to.throwException(/child cannot set logger name/i);
			});
		});
		describe('info()', () => {
			it('should be a function', () => {
				expect(Northwoods.Logger.prototype.info).to.be.a('function');
				expect(Northwoods.Logger.prototype.info.length).to.be(2);
			});
			it('should write info to log', () => {
				const obj = { what: 'cat?', when: 'now!', where: 'tree...' };
				const msg = 'A cat in a tree!';
				const log = new Northwoods.Logger({ name: 'test123' });
				const spy = sinon.spy();
				log._log = spy;
				log.info(obj, msg);
				expect(spy.calledOnce).to.be(true);
				expect(spy.args[0]).to.be.eql([ Northwoods.INFO, [ obj, msg ] ]);
			});
			it('should write log with string first argument', () => {
				const msg = 'A cat in a tree! %d %s';
				const log = new Northwoods.Logger({ name: 'test123', extra: 'catnip' });
				const spy = sinon.spy();
				log._write = spy;
				log.info(msg, 2, 'B');
				expect(spy.calledOnce).to.be(true);
				expect(spy.args.length).to.be(1);
				expect(spy.args[0].length).to.be(1);
				const arg0 = spy.args[0][0];
				expect(arg0).to.be.an('object');
				expect(arg0.name).to.be('test123');
				expect(arg0.v).to.be(0);
				expect(arg0.msg).to.be('A cat in a tree! 2 B');
				expect(arg0.extra).to.be('catnip');
			});
		});
		describe('internal functions', () => {
			describe('_write', () => {
				it('should be a function', () => {
					expect(Northwoods.Logger.prototype._write).to.be.a('function');
					expect(Northwoods.Logger.prototype._write.length).to.be(1);
				});
				it('should pass write though to underlying stream', () => {
					function MockRawStream() { }
					const writeSpy = sinon.spy();
					MockRawStream.prototype.write = writeSpy;
					const log = new Northwoods.Logger({ name: 'test1' });
					log._write = sinon.spy(Northwoods.Logger.prototype._write);
					log.streams = [ ];
					log.addStream({
			      type: 'raw',
			      stream: new MockRawStream()
					});
					expect(log.streams.length).to.be(1);
					const results = log._write({ test: 1 });
					expect(writeSpy.calledOnce).to.be(true);
				});
			});
			describe('_now()', () => {
				it('should be a function', () => {
					expect(Northwoods.Logger.prototype._now).to.be.a('function');
					expect(Northwoods.Logger.prototype._now.length).to.be(0);
				});
				it('should be build a formatted date', () => {
					const log = new Northwoods.Logger({ name: 'test123' });
					const now = log._now();
					expect(now).to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
				});
			});
			describe('_format()', () => {
				it('should format an empty message', () => {
					const log = new Northwoods.Logger({ name: 'test123' });
					const results = log._format();
					expect(results).to.be('');
				});
				it('should format an message with no parameters', () => {
					const log = new Northwoods.Logger({ name: 'test123' });
					const results = log._format('...right through a seam in your wall.');
					expect(results).to.be('...right through a seam in your wall.');
				});
				it('should format an message with numbers', () => {
					const log = new Northwoods.Logger({ name: 'test123' });
					const results = log._format('%d %d %d... does Whiskers like Ba%daS?', [ 1, 2, 3, 'Boom' ]);
					expect(results).to.be('1 2 3... does Whiskers like BaNaNaS?');
				});
				it('should format an JSON message', () => {
					const log = new Northwoods.Logger({ name: 'test123' });
					const results = log._format('There once was %j and and they lived wherever they wanted to.', [ { '8': 'cats' } ]);
					expect(results).to.be('There once was {"8":"cats"} and and they lived wherever they wanted to.');
				});
			});
			describe('_record()', () => {
				it('should create record given object and message', () => {
					const obj = { what: 'cat', when: 'before', where: 'bookshelf' };
					const msg = 'How did the cat get up there?';
					const log = new Northwoods.Logger({ name: 'feline' });
					const rec = log._record(30, [ obj, msg ]);
					const keys = Object.keys(rec);
					expect(rec).to.be.an('object');
					expect(rec.pid).to.be(Northwoods.PID);
					expect(rec.level).to.be(Northwoods.INFO);
					expect(rec.v).to.be(Northwoods.LOG_VERSION);
					expect(rec.name).to.be('feline');
					expect(rec.hostname).to.be.a('string');
					expect(rec.msg).to.be('How did the cat get up there?');
					expect(rec.time).to.match(/^20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
					expect(keys).to.eql([ 'name', 'hostname', 'pid', 'level', 'what', 'when', 'where', 'msg', 'time', 'v' ]);
				});
			});
			it('should create record given object and formatted message', () => {
				const obj = { what: 'mama-cat', when: 'after', where: 'kitchen' };
				const msg = 'Really? How did he get up there? %s %d times and I\'ve never seen it. %s';
				const log = new Northwoods.Logger({ name: 'housecat' });
				const rec = log._record(30, [ obj, msg, 'Did you see?', 12, 'Sigh.' ]);
				const keys = Object.keys(rec);
				expect(rec).to.be.an('object');
				expect(rec.pid).to.be(Northwoods.PID);
				expect(rec.level).to.be(Northwoods.INFO);
				expect(rec.v).to.be(Northwoods.LOG_VERSION);
				expect(rec.name).to.be('housecat');
				expect(rec.hostname).to.be.a('string');
				expect(rec.msg).to.be('Really? How did he get up there? Did you see? 12 times and I\'ve never seen it. Sigh.');
				expect(rec.time).to.match(/^20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
				expect(keys).to.eql([ 'name', 'hostname', 'pid', 'level', 'what', 'when', 'where', 'msg', 'time', 'v' ]);
			});
		});
	});
});
