const { resolvePath } = require('./utils');

describe('resolvePath', () => {
    it('should find correct file for test filename', async () => {
        const path = await resolvePath('get-emoji.tests.ps1');
        expect(path).toBe(
            'tests/get-emoji.tests.ps1'
        );
    });
});