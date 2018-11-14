import * as config from '../../../../config/index';
import IDiningHallBase from '../../../models/dining-halls/IDiningHallBase';
import request from '../../../common/retryingRequest';
import * as cheerio from 'cheerio';

const NAME_FROM_URL = new RegExp(`^${config.pages.DINING_HALL_MENU}(.+?)/all`);

/**
 * Make a request to the MSU eat at state homepage, to parse all dining hall primary data from it.
 * This will return an array of objects which have the following properties:
 * - hallName
 * - brandName
 * - fullName
 * - searchName
 * Usually you will want to represent a hall with the fullName.
 * @returns {Promise<Array.<Object>>}
 */
async function retrieveDiningHalls(): Promise<IDiningHallBase[]> {
    let body;
    try {
        body = await request(config.pages.EAT_AT_STATE);
    } catch (e) {
        throw e;
    }

    const $ = cheerio.load(body);

    const nameSquares = $('.dining-menu-name');
    const diningHalls = [];

    nameSquares.each(function() {
        const $nameSquare = $(this);

        // Get the only a tag in this square, which would link to the menu,
        // and get its href for the url
        const url = decodeURI($nameSquare.find('a').attr('href'));

        //console.log('URL: ' + url);

        // If the URL doesn't start with the dining hall URL, it's another kind of page
        // such as starbucks, food truck, etc.
        if (!url.toLowerCase().startsWith(config.pages.DINING_HALL_MENU)) {
            return;
        }

        // If the full name cannot be obtained from the URL, something is horribly wrong about
        // this dining hall.
        if (!NAME_FROM_URL.test(url)) {
            return;
        }

        // The first match in this will be the full name (see regexp)
        const fullName = url.match(NAME_FROM_URL)[1];

        //console.log(`This dining hall's name is ${fullName}`);

        // The first match from this class find will be the one we want,
        // so get the data contained in its first child (which is a div
        // tag, apparently)
        const hallName = $($nameSquare.find('.dining-hall-name')[0]).text();
        const brandName = $($nameSquare.find('.brand-name')[0]).text();

        diningHalls.push({ hallName, brandName, fullName,
            searchName: hallName.toLowerCase().replace('hall', '').trim() });
    });

    return diningHalls;
}

export { retrieveDiningHalls }