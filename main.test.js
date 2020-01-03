const i = require('./main')

const createNewServerPreferences = i.createNewServerPreferences
const fuzzyMatch = i.fuzzyMatch
const parseConfigurationCommands = i.parseConfigurationCommands
const parseAnimeTitles = i.parseAnimeTitles

const sp = createNewServerPreferences()

const mockChannels = [
    'general',
    'anime-suggestions',
    'random-channel-name'
]

test('Make sure jest is working', () => {
    expect(1 + 1).toBe(2)
})

describe('parseConfigurationCommands function', () => {
    it('should print help when requested', () => {
        expect(
            parseConfigurationCommands(
                true,
                's!help',
                '',
                '',
                [],
                createNewServerPreferences(),
                'server ID',
                (serverId, preferences) => {
                    expect(false).toBe(true) // Fail test
                },
                (reply) => {
                    expect(reply.includes('Command list')).toBe(true)
                }
            )
        ).toBe(true)
        expect(
            parseConfigurationCommands(
                false,
                's!help',
                '',
                '',
                [],
                createNewServerPreferences(),
                'server ID',
                (serverId, preferences) => {
                    expect(false).toBe(true) // Fail test
                },
                (reply) => {
                    expect(reply.includes('Command list')).toBe(true)
                }
            )
        ).toBe(true)
    })
    it('should print help when an invalid command is used', () => {
        expect(
            parseConfigurationCommands(
                true,
                's!NotACommand',
                '',
                '',
                [],
                createNewServerPreferences(),
                'server ID',
                (serverId, preferences) => {
                    expect(false).toBe(true) // Fail test
                },
                (reply) => {
                    expect(reply.includes('Command list')).toBe(true)
                }
            )
        ).toBe(false)
        expect(
            parseConfigurationCommands(
                false,
                's!ThisDoesNotExist',
                '',
                '',
                [],
                createNewServerPreferences(),
                'server ID',
                (serverId, preferences) => {
                    expect(false).toBe(true) // Fail test
                },
                (reply) => {
                    expect(reply.includes('Command list')).toBe(true)
                }
            )
        ).toBe(false)
    })
    it('should do nothing if a command is not given', () => {
        expect(
            parseConfigurationCommands(
                true,
                'Howdy partner',
                '',
                '',
                [],
                createNewServerPreferences(),
                'server ID',
                (serverId, preferences) => {
                    expect(false).toBe(true) // Fail test
                },
                (reply) => {
                    expect(false).toBe(true) // Fail test
                }
            )
        ).toBe(undefined)
        expect(
            parseConfigurationCommands(
                false,
                'This does not contain any sort of command',
                '',
                '',
                [],
                createNewServerPreferences(),
                'server ID',
                (serverId, preferences) => {
                    expect(false).toBe(true) // Fail test
                },
                (reply) => {
                    expect(false).toBe(true) // Fail test
                }
            )
        ).toBe(undefined)
    })
    it('should list all channel names when requested', () => {
        expect(
            parseConfigurationCommands(
                false,
                's!list',
                '',
                '',
                mockChannels,
                createNewServerPreferences(),
                'server ID',
                (serverId, preferences) => {
                    expect(false).toBe(true) // Fail test
                },
                (reply) => {
                    mockChannels.forEach(channel => {
                        expect(reply.includes(channel)).toBe(true)
                    })
                }
            )
        ).toBe(true)
    })
    it('should print about information if requested', () => {
        expect(
            parseConfigurationCommands(
                true,
                's!about',
                '',
                '',
                [],
                createNewServerPreferences(),
                'server ID',
                (serverId, preferences) => {
                    expect(false).toBe(true) // Fail test
                },
                (reply) => {
                    expect(reply.includes('About Synopsis-fy')).toBe(true)
                }
            )
        ).toBe(true)
        expect(
            parseConfigurationCommands(
                false,
                's!about',
                '',
                '',
                [],
                createNewServerPreferences(),
                'server ID',
                (serverId, preferences) => {
                    expect(false).toBe(true) // Fail test
                },
                (reply) => {
                    expect(reply.includes('About Synopsis-fy')).toBe(true)
                }
            )
        ).toBe(true)
    })
    it('should enable this channel if requested', () => {
        let saveFlag = false
        expect(
            parseConfigurationCommands(
                true,
                's!enable',
                '',
                mockChannels[0],
                mockChannels,
                createNewServerPreferences(),
                'server ID',
                (serverId, preferences) => {
                    expect(preferences.allowedChannels.includes(mockChannels[0])).toBe(true)
                    saveFlag = true
                },
                (reply) => {

                }
            )
        ).toBe(true)
        expect(saveFlag).toBe(true)
    })
    it('should disable this channel if requested', () => {
        let saveFlag = false
        expect(
            parseConfigurationCommands(
                true,
                's!disable',
                '',
                mockChannels[1],
                mockChannels,
                createNewServerPreferences(),
                'server ID',
                (serverId, preferences) => {
                    expect(preferences.allowedChannels.includes(mockChannels[1])).toBe(false)
                    saveFlag = true
                },
                (reply) => {

                }
            )
        ).toBe(true)
        expect(saveFlag).toBe(true)
    })
    it('should enable a specific channel if requested', () => {
        let saveFlag = false
        expect(
            parseConfigurationCommands(
                true,
                's!enable ' + mockChannels[0],
                '',
                mockChannels[1],
                mockChannels,
                createNewServerPreferences(),
                'server ID',
                (serverId, preferences) => {
                    expect(preferences.allowedChannels.includes(mockChannels[0])).toBe(true)
                    saveFlag = true
                },
                (reply) => {

                }
            )
        ).toBe(true)
        expect(saveFlag).toBe(true)
    })
    it('should disable a specific channel if requested', () => {
        let saveFlag = false
        expect(
            parseConfigurationCommands(
                true,
                's!disable ' + mockChannels[1],
                '',
                mockChannels[0],
                mockChannels,
                createNewServerPreferences(),
                'server ID',
                (serverId, preferences) => {
                    expect(preferences.allowedChannels.includes(mockChannels[1])).toBe(false)
                    saveFlag = true
                },
                (reply) => {

                }
            )
        ).toBe(true)
        expect(saveFlag).toBe(true)
    })
})

describe('parseAnimeTitles function', () => {
    it('should match quoted titles', () => {
        let callbackFlag = false
        parseAnimeTitles(
            'Here is a message containing a quoted anime title "Anime Title"',
            mockChannels[1],
            createNewServerPreferences(),
            (title, serverPreferences, onSuccess, onReply) => {
                expect(title == 'Anime Title').toBe(true)
                callbackFlag = true
            },
            (anime, info, onReply) => {

            },
            (reply, attachment) => {

            }
        )
        expect(callbackFlag).toBe(true)
    })
    it('should match bolded titles', () => {
        let callbackFlag = false
        parseAnimeTitles(
            'Here is a message containing a quoted anime title **Anime Title**',
            mockChannels[1],
            createNewServerPreferences(),
            (title, serverPreferences, onSuccess, onReply) => {
                expect(title == 'Anime Title').toBe(true)
                callbackFlag = true
            },
            (anime, info, onReply) => {

            },
            (reply, attachment) => {

            }
        )
        expect(callbackFlag).toBe(true)
    })
    it('should match italicized titles', () => {
        let callbackFlag = false
        parseAnimeTitles(
            'Here is a message containing a quoted anime title *Anime Title*',
            mockChannels[1],
            createNewServerPreferences(),
            (title, serverPreferences, onSuccess, onReply) => {
                expect(title == 'Anime Title').toBe(true)
                callbackFlag = true
            },
            (anime, info, onReply) => {

            },
            (reply, attachment) => {

            }
        )
        expect(callbackFlag).toBe(true)
    })
    it('should match underline style italicized titles', () => {
        let callbackFlag = false
        parseAnimeTitles(
            'Here is a message containing a quoted anime title _Anime Title_',
            mockChannels[1],
            createNewServerPreferences(),
            (title, serverPreferences, onSuccess, onReply) => {
                expect(title == 'Anime Title').toBe(true)
                callbackFlag = true
            },
            (anime, info, onReply) => {

            },
            (reply, attachment) => {

            }
        )
        expect(callbackFlag).toBe(true)
    })
    it('should match underlined titles', () => {
        let callbackFlag = false
        parseAnimeTitles(
            'Here is a message containing a quoted anime title __Anime Title__',
            mockChannels[1],
            createNewServerPreferences(),
            (title, serverPreferences, onSuccess, onReply) => {
                expect(title == 'Anime Title').toBe(true)
                callbackFlag = true
            },
            (anime, info, onReply) => {

            },
            (reply, attachment) => {

            }
        )
        expect(callbackFlag).toBe(true)
    })
    it('should match struckthrough titles', () => {
        let callbackFlag = false
        parseAnimeTitles(
            'Here is a message containing a quoted anime title ~~Anime Title~~',
            mockChannels[1],
            createNewServerPreferences(),
            (title, serverPreferences, onSuccess, onReply) => {
                expect(title == 'Anime Title').toBe(true)
                callbackFlag = true
            },
            (anime, info, onReply) => {

            },
            (reply, attachment) => {

            }
        )
        expect(callbackFlag).toBe(true)
    })
    it('should match code blocked titles', () => {
        let callbackFlag = false
        parseAnimeTitles(
            'Here is a message containing a quoted anime title `Anime Title`',
            mockChannels[1],
            createNewServerPreferences(),
            (title, serverPreferences, onSuccess, onReply) => {
                expect(title == 'Anime Title').toBe(true)
                callbackFlag = true
            },
            (anime, info, onReply) => {

            },
            (reply, attachment) => {

            }
        )
        expect(callbackFlag).toBe(true)
    })
    it('should match single quote titles', () => {
        let callbackFlag = false
        parseAnimeTitles(
            `Here is a message containing a quoted anime title 'Anime Title'`,
            mockChannels[1],
            createNewServerPreferences(),
            (title, serverPreferences, onSuccess, onReply) => {
                expect(title == 'Anime Title').toBe(true)
                callbackFlag = true
            },
            (anime, info, onReply) => {

            },
            (reply, attachment) => {

            }
        )
        expect(callbackFlag).toBe(true)
    })
    it('should match multiple titles', () => {
        let titles = [
            'Title One',
            'Title Two',
            'Title Three'
        ]
        parseAnimeTitles(
            'Here is a message with multiple titles. *Title One*, _Title Two_, and **Title Three**',
            mockChannels[1],
            createNewServerPreferences(),
            (title, serverPreferences, onSuccess, onReply) => {
                titles = titles.filter(value => { return value != title })
            },
            (anime, info, onReply) => {

            },
            (reply, attachment) => {

            }
        )
        expect(titles.length).toBe(0)
    })
    it('should match nothing when given no titles', () => {
        parseAnimeTitles(
            'This message does not contain any messages but it does have tricky symbols ` * ~ " ',
            mockChannels[1],
            createNewServerPreferences(),
            (title, serverPreferences, onSuccess, onReply) => {
                expect(false).toBe(true) // Fail test
            },
            (anime, info, onReply) => {

            },
            (reply, attachment) => {

            }
        )
    })
})

describe('fuzzyMatch function', () => {
    it('should match exact titles', () => {
        expect(fuzzyMatch('Attack on Titan', sp)).toHaveProperty('title', 'Shingeki no Kyojin')
        expect(fuzzyMatch('Sword Art Online', sp)).toHaveProperty('title', 'Sword Art Online')
        expect(fuzzyMatch('gintama', sp)).toHaveProperty('title', 'Gintama')
        expect(fuzzyMatch('Fullmetal Alchemist', sp)).toHaveProperty('title', 'Fullmetal Alchemist')
    })
    it('should not match anything when not given a title', () => {
        expect(fuzzyMatch('', sp)).toBeNull()
        expect(fuzzyMatch('this should not match anything', sp)).toBeNull()
        expect(fuzzyMatch('dO nOt matCh', sp)).toBeNull()
        expect(fuzzyMatch('no', sp)).toBeNull()
    })
    it('should match slight misspellings of titles', () => {
        expect(fuzzyMatch('Attak on Titan', sp)).toHaveProperty('title', 'Shingeki no Kyojin')
        expect(fuzzyMatch('sord art Online', sp)).toHaveProperty('title', 'Sword Art Online')
        expect(fuzzyMatch('gintam', sp)).toHaveProperty('title', 'Gintama')
        expect(fuzzyMatch('fulmetal Alchemist', sp)).toHaveProperty('title', 'Fullmetal Alchemist')
    })
    it('should match substrings of titles if appropriate', () => {
        expect(fuzzyMatch('Attack on t', sp)).toHaveProperty('title', 'Shingeki no Kyojin')
        expect(fuzzyMatch('d art online', sp)).toHaveProperty('title', 'Sword Art Online')
        expect(fuzzyMatch('Fullmetal', sp)).toHaveProperty('title', 'Fullmetal Alchemist')
    })
})