import cheerio from 'cheerio';
import IDiningHallMenu from '../../../../interfaces/dining-halls/menu/IDiningHallMenu';
import IMenuDaySelection from '../../../../interfaces/dining-halls/menu/IMenuDaySelection';
import makeRetryingRequest from '../../../common/retryingRequest';
import MenuParser from '../../../parsers/menu';

const getRequestUrl = (selection: IMenuDaySelection) => `https://eatatstate.msu.edu/menu/${selection.diningHall.fullName}/all/${selection.menuDate.getFormatted()}`;

async function retrieveMenusForDayFromWeb(selection: IMenuDaySelection): Promise<IDiningHallMenu[]> {
    const responseBody: string = await makeRetryingRequest(getRequestUrl(selection));

    const $ = cheerio.load(responseBody);

    return (new MenuParser()).parse($);
}

export default retrieveMenusForDayFromWeb;