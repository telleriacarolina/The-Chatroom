const { describe, it, expect } = require('vitest');

describe('Utility Functions', () => {
    it('should return the correct sum of two numbers', () => {
        const sum = (a, b) => a + b;
        expect(sum(1, 2)).toBe(3);
    });

    it('should return the correct difference of two numbers', () => {
        const subtract = (a, b) => a - b;
        expect(subtract(5, 3)).toBe(2);
    });
});