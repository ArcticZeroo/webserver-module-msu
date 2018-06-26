const assert = require('assert');
const hours = require('../hours');

function sameHours(actual, expected) {
    assert.strictEqual(actual.start, expected.start);
    assert.strictEqual(actual.end, expected.end);
}

describe('Hours Parsing', function () {
    describe('Time String Only Parsing', function () {
        it('Should parse basic am strings', function () {
            sameHours(hours.parseOnlyTimeString('7 a.m.-10 a.m.'), { start: 7.0, end: 10.0 });
        });

        it('Should parse strings with different identifiers', function () {
            sameHours(hours.parseOnlyTimeString('7 a.m.-5 p.m.'), { start: 7.0, end: 17.0 });
        });

        it('Should parse strings with a missing first identifier', function () {
            sameHours(hours.parseOnlyTimeString('3-5 p.m.'), { start: 15.0, end: 17.0 });
        });

        it('Should parse strings with part of an hour', function () {
            sameHours(hours.parseOnlyTimeString('1 p.m.-4:30 p.m.'), { start: 13.0, end: 16.5 });
        });

        it('Should parse strings with midnight', function () {
            sameHours(hours.parseOnlyTimeString('1 p.m.-midnight'), { start: 13.0, end: 24.0 });
        });
    });
});