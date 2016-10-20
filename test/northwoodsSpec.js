/**
 * test/northwoodsSpec.js
 */
'use strict';

/**
 * Imports.
 */
const expect = require('expect.js');
const Northwoods = require('../index');

/**
 * Tests.
 */
describe('Northwoods', () => {
	it('should be a namespace', () => {
		expect(Northwoods).to.be.an('object');
	});
	describe('constants', () => {
		it('should have a version', () => {
			expect(Northwoods.VERSION).to.match(/^\d+\.\d+\.\d+$/);
		});
		it('should have a log version', () => {
			expect(Northwoods.LOG_VERSION).to.be(0);
		});
		it('should have a program ID', () => {
			expect(Northwoods.PID).to.be(0);
		});
	});
	describe('log levels', () => {
		it('should have a log levels', () => {
			expect(Northwoods.DEBUG).to.be(20);
			expect(Northwoods.WARN).to.be(40);
		});
		it('should have a log level mappings', () => {
			expect(Northwoods.levelFromName).to.be.an('object');
			expect(Northwoods.nameFromLevel).to.be.an('object');
			expect(Northwoods.levelFromName['trace']).to.be(10);
			expect(Northwoods.nameFromLevel['60']).to.be('fatal');
		});
		describe('resolveLevel', () => {
			it('should be a function', () => {
				expect(Northwoods.resolveLevel).to.be.a('function');
				expect(Northwoods.resolveLevel.length).to.be(1);
			});
			it('should resolve a log level number', () => {
				const results = Northwoods.resolveLevel(10);
				expect(results).to.be(Northwoods.TRACE)
			});
			it('should resolve a log level string', () => {
				const results = Northwoods.resolveLevel('TRACE');
				expect(results).to.be(Northwoods.TRACE);
			});
			describe('should throw if given invalid', () => {
				it('log level string', () => {
					expect(() => {
						Northwoods.resolveLevel('warning');
					}).to.throwException(/unknown log level/);
				});
				it('log level not-a-number', () => {
					expect(() => {
						Northwoods.resolveLevel(Number('not a number'));
					}).to.throwException(/unknown log level/);
				});
			})
		});
	});
	describe('createLogger', () => {
		it('should be a function', () => {
			expect(Northwoods.createLogger).to.be.a('function');
			expect(Northwoods.createLogger.length).to.be(1);
		});
		it('should build a logger', () => {
			const log = Northwoods.createLogger({ name: 'pine' });
			expect(log).to.be.an(Northwoods.Logger);
		});
	});
});
