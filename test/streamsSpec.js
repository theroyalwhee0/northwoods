/**
 * test/streamsSpec.js
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
	describe('streamTypes', () => {
		it('should be a namespace', () => {
			expect(Northwoods.streamTypes).to.be.an('object');
		});
		describe('ConsoleObjectRawStream', () => {
			const ConsoleObjectRawStream = Northwoods.streamTypes.ConsoleObjectRawStream;
			it('should be a class', () => {
				expect(ConsoleObjectRawStream).to.be.a('function');
				expect(ConsoleObjectRawStream.length).to.be(0);
				expect(ConsoleObjectRawStream.prototype).to.be.an('object');
				expect(ConsoleObjectRawStream.prototype.constructor).to.be.a('function');
			});
			it('should create an instance', () => {
				const instance = new ConsoleObjectRawStream();
				expect(instance).to.be.a(ConsoleObjectRawStream);
			});
			it('should support write', () => {
				const instance = new ConsoleObjectRawStream();
				const consoleSpy = {
					debug: sinon.spy(),
					info: sinon.spy(),
					warn: sinon.spy(),
					error: sinon.spy()
				};
				instance._console = consoleSpy;
				let call = 0;
				instance.write({ call: call++, msg: 'Ping', level: Northwoods.DEBUG });
				expect(consoleSpy.debug.callCount).to.be(1);
				expect(consoleSpy.debug.args[0]).to.eql([ { call: 0, msg: 'Ping', level: 20 } ]);
				expect(consoleSpy.info.callCount).to.be(0);
				instance.write({ call: call++, level: Northwoods.INFO });
				expect(consoleSpy.debug.callCount).to.be(1);
				expect(consoleSpy.info.callCount).to.be(1);
				expect(consoleSpy.info.args[0]).to.eql([ { call: 1, level: 30 } ]);
				instance.write({ call: call++, level: Northwoods.DEBUG });
				expect(consoleSpy.debug.callCount).to.be(2);
				expect(consoleSpy.debug.args[1]).to.eql([ { call: 2, level: 20 } ]);
				expect(consoleSpy.debug.args.length).to.be(2);
				expect(consoleSpy.info.callCount).to.be(1);
				expect(consoleSpy.info.args.length).to.be(1);
			});
		});
		describe('ConsoleFormattedRawStream', () => {
			const ConsoleFormattedRawStream = Northwoods.streamTypes.ConsoleFormattedRawStream;
			it('should be a class', () => {
				expect(ConsoleFormattedRawStream).to.be.a('function');
				expect(ConsoleFormattedRawStream.length).to.be(0);
				expect(ConsoleFormattedRawStream.prototype).to.be.an('object');
				expect(ConsoleFormattedRawStream.prototype.constructor).to.be.a('function');
			});
			it('should create an instance', () => {
				const instance = new ConsoleFormattedRawStream();
				expect(instance).to.be.a(ConsoleFormattedRawStream);
			});
			it('should support write', () => {
				const instance = new ConsoleFormattedRawStream();
				const consoleSpy = {
					debug: sinon.spy(),
					info: sinon.spy(),
					warn: sinon.spy(),
					error: sinon.spy()
				};
				instance._console = consoleSpy;
				let call = 0;
				instance.write({ call: call++, msg: 'Ping', level: Northwoods.WARN });
				expect(consoleSpy.warn.callCount).to.be(1);
				expect(consoleSpy.warn.args[0]).to.eql([ '%s %o', 'Ping', { call: 0 } ]);
				expect(consoleSpy.error.callCount).to.be(0);
				instance.write({ call: call++, level: Northwoods.FATAL });
				expect(consoleSpy.warn.callCount).to.be(1);
				expect(consoleSpy.error.callCount).to.be(1);
				expect(consoleSpy.error.args[0]).to.eql([ '%s %o', '', { call: 1 } ]);
				instance.write({ call: call++, level: Northwoods.ERROR });
				expect(consoleSpy.warn.callCount).to.be(1);
				expect(consoleSpy.warn.args.length).to.be(1);
				expect(consoleSpy.error.callCount).to.be(2);
				expect(consoleSpy.error.args[1]).to.eql([ '%s %o', '', { call: 2 } ]);
				expect(consoleSpy.error.args.length).to.be(2);
			});
		});
	});
});
