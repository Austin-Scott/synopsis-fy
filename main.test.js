const i = require('./main')

const createNewServerPreferences = i.createNewServerPreferences
const fuzzyMatch = i.fuzzyMatch

const sp = createNewServerPreferences()

test('Make sure jest is working', () => {
    expect(1 + 1).toBe(2)
})

describe('fuzzyMatch function', () => {
    it('should match exact titles', () => {
        expect(fuzzyMatch('attack on titan', sp)).toHaveProperty('title', 'Shingeki no Kyojin')
        expect(fuzzyMatch('sword art online', sp)).toHaveProperty('title', 'Sword Art Online')
        expect(fuzzyMatch('gintama', sp)).toHaveProperty('title', 'Gintama')
        expect(fuzzyMatch('fullmetal alchemist', sp)).toHaveProperty('title', 'Fullmetal Alchemist')
    })
    it('should not match anything when not given a title', () => {
        expect(fuzzyMatch('', sp)).toBeNull()
        expect(fuzzyMatch('this should not match anything', sp)).toBeNull()
        expect(fuzzyMatch('do not match', sp)).toBeNull()
        expect(fuzzyMatch('no', sp)).toBeNull()
    })
    it('should match slight misspellings of titles', () => {
        expect(fuzzyMatch('attak on titan', sp)).toHaveProperty('title', 'Shingeki no Kyojin')
        expect(fuzzyMatch('sord art online', sp)).toHaveProperty('title', 'Sword Art Online')
        expect(fuzzyMatch('gintam', sp)).toHaveProperty('title', 'Gintama')
        expect(fuzzyMatch('fulmetal alchemist', sp)).toHaveProperty('title', 'Fullmetal Alchemist')
    })
    it('should match substrings of titles if appropriate', () => {
        expect(fuzzyMatch('attack on t', sp)).toHaveProperty('title', 'Shingeki no Kyojin')
        expect(fuzzyMatch('d art online', sp)).toHaveProperty('title', 'Sword Art Online')
        expect(fuzzyMatch('fullmetal', sp)).toHaveProperty('title', 'Fullmetal Alchemist')
    })
})