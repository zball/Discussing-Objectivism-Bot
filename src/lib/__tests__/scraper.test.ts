import { scrapeSessions } from '../scraper';


describe('scrapeSessions', () => {
  const mockHtml = `
    <div class="e-con-inner">
      <h2>Attend an Upcoming Discussion</h2>
      <div>
        <div>
          <div>
            <h2>Session Title</h2>
            <div class="elementor-cta__description">Session Date</div>
            <a class="elementor-cta" href="https://example.com/session">Link</a>
          </div>
        </div>
      </div>
    </div>
  `;

  beforeAll(() => {
    process.env.ARI_SCRAPE_URL = 'https://mocked-url.com';
  });

  afterAll(() => {
    delete process.env.ARI_SCRAPE_URL;
  });

  it('should return session info from valid HTML', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () => mockHtml,
    } as any);
    const sessions = await scrapeSessions();
    expect(sessions).toEqual([
      {
        title: 'Session Title',
        date: 'Session Date',
        link: 'https://example.com/session',
      },
    ]);
  });

  it('should throw if ARI_SCRAPE_URL is not defined', async () => {
    delete process.env.ARI_SCRAPE_URL;
    await expect(scrapeSessions()).rejects.toThrow('ARI_SCRAPE_URL is not defined.');
    process.env.ARI_SCRAPE_URL = 'https://mocked-url.com';
  });

  it('should throw if no upcoming discussions found', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () => '<div></div>',
    } as any);
    await expect(scrapeSessions()).rejects.toThrow('No upcoming discussions found.');
  });

  it('should warn if session info is missing', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const badHtml = `
      <div class="e-con-inner">
        <h2>Attend an Upcoming Discussion</h2>
        <div><div><div><h2>Session Title</h2></div></div></div>
      </div>
    `;
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () => badHtml,
    } as any);
    await scrapeSessions();
    expect(warnSpy).toHaveBeenCalledWith('Missing session information. DOM may have changed.');
    warnSpy.mockRestore();
  });
});
