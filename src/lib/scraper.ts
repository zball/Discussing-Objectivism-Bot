
import * as cheerio from 'cheerio';

const HEADER_TOKEN = "Attend an Upcoming Discussion"

export type SessionInfo = {
    title: string;
    date: string;
    link: string;
}

/**
 * Scrapes upcoming discussion sessions from the ARI website.
 *
 * This function is fragile because it relies on the current DOM structure of the target page.
 * If the DOM changes, selectors may break and the function will throw exceptions as an early warning.
 * This is intentional to help detect when the scraping logic needs to be updated.
 *
 * @throws {Error} If required environment variables are missing, or if the DOM structure does not match expectations.
 * @returns {Promise<SessionInfo[]>} Array of session info objects with title, date, and link.
 */
export async function scrapeSessions(): Promise<SessionInfo[]> {
    var sessions: SessionInfo[] = [];
    if (!process.env.ARI_SCRAPE_URL) {
        throw new Error('ARI_SCRAPE_URL is not defined.');
    }
    const response = await fetch(process.env.ARI_SCRAPE_URL);
    if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }
    const html = await response.text();
    const $ = cheerio.load(html);

    return extractSessions(extractParentContainer($), $);
}

function extractParentContainer($: cheerio.CheerioAPI): cheerio.Cheerio<any> {
    const innerElms = $('.e-con-inner').filter((_, el) => {
        return $(el).text().includes(HEADER_TOKEN);
    });
    if (innerElms.length === 0) {
        throw new Error('No upcoming discussions found.');
    }
    return innerElms;
}

function extractSessions(innerElms: cheerio.Cheerio<any>, $: cheerio.CheerioAPI): SessionInfo[] {
    const sessions: SessionInfo[] = [];
    innerElms.children().each((_: number, child: any) => {
        // Skip the header child
        if ($(child).text().includes(HEADER_TOKEN)) {
            return;
        }

        // Meat and puhtaytas
        $(child).children().first().children().each((__: number, grandchild: any) => {
            let title = $(grandchild).find('h2').text().trim();
            // Strip the "" from the front and end of string
            title = title.replace(/^(\"|“|”)+|(\"|“|”)+$/g, '');
            if (!title) {
                throw new Error('Missing session title.');
            }

            const date = $(grandchild).find('.elementor-cta__description').text().trim();
            const link = $(grandchild).find('.elementor-cta').attr('href') || '';
            if (!date || !link) {
                console.warn('Missing session information. DOM may have changed.');
            }

            const sessionInfo: SessionInfo = {
                title,
                date,
                link
            };
            sessions.push(sessionInfo);
        });
    });
    return sessions;
}