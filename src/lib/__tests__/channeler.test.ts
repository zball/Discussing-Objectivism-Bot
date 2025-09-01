import { createChannelsFromSessions, normalize } from '../channeler';
import { ChannelType, Guild, Collection } from 'discord.js';
import { SessionInfo } from '../scraper';

describe('createChannelsFromSessions', () => {
  let guild: Guild;
  let mockCreate: jest.Mock;
  let mockCache: Collection<string, any>;

  beforeEach(() => {
    mockCreate = jest.fn(async (opts) => ({ name: opts.name }));
    mockCache = new Collection();
    guild = {
      channels: {
        cache: mockCache,
        create: mockCreate,
      },
    } as unknown as Guild;
  });

  it('creates a new channel if it does not exist', async () => {
    const sessions: SessionInfo[] = [
      { title: 'Session 1', date: '2025-09-01', link: 'url' },
    ];
    await createChannelsFromSessions(guild, sessions, 'catid');
    expect(mockCreate).toHaveBeenCalledWith({
      name: 'Session 1',
      type: ChannelType.GuildForum,
      parent: 'catid',
      topic: '2025-09-01',
    });
  });

  it('does not create a channel if it already exists', async () => {
    mockCache.set('1', {
      name: 'Session 1',
      type: ChannelType.GuildForum,
    });
    const sessions: SessionInfo[] = [
      { title: 'Session 1', date: '2025-09-01', link: 'url' },
    ];
    const infoSpy = jest.spyOn(console, 'info').mockImplementation();
    await createChannelsFromSessions(guild, sessions, 'catid');
    expect(mockCreate).not.toHaveBeenCalled();
    expect(infoSpy).toHaveBeenCalledWith(
      'Not creating channel. Channel already exists:',
      'Session 1'
    );
    infoSpy.mockRestore();
  });
});

describe('normalize', () => {
  it('should lowercase the string', () => {
    expect(normalize('ABC')).toBe('abc');
  });

  it('should remove spaces', () => {
    expect(normalize('A B C')).toBe('abc');
  });

  it('should remove hyphens', () => {
    expect(normalize('A-B-C')).toBe('abc');
  });

  it('should remove both spaces and hyphens', () => {
    expect(normalize('A - B - C')).toBe('abc');
  });

  it('should handle mixed case and separators', () => {
    expect(normalize('Review-of Randall’s Aristotle')).toBe("reviewofrandall’saristotle");
  });

  it('should handle empty string', () => {
    expect(normalize('')).toBe('');
  });
});
