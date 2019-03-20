import IWebParser from '../../interfaces/api/IWebParser';
import IDiningHallMenu from '../../interfaces/dining-halls/menu/IDiningHallMenu';
import IMenuItem from '../../interfaces/dining-halls/menu/IMenuItem';
import IDiningHallVenue from '../../interfaces/dining-halls/menu/IDiningHallVenue';
import CheerioUtil from '../util/CheerioUtil';

const selectors = {
    venue: {
        group: '.eas-view-group',
        title: '.venue-title',
        description: '.venue-description'
    },
    individualMenu: {
        group: '.eas-list',
        mealTime: '.meal-time',
        menuItems: '.menu-item'
    },
    menuItem: {
        name: '.meal-title',
        diningPrefs: '.dining-prefs',
        allergens: '.allergens'
    },
    allergens: {
        individual: '.allergen'
    }
};

const mealTimeNames = {
    Breakfast: 'Breakfast',
    Lunch: 'Lunch',
    Dinner: 'Dinner',
    LateNight: 'Late Night'
};

const mealTimeOrder = [mealTimeNames.Breakfast, mealTimeNames.Lunch, mealTimeNames.Dinner, mealTimeNames.LateNight];

export default class MenuParser implements IWebParser<IDiningHallMenu[]> {
    private parseMenuItem($: CheerioStatic, item: Cheerio): IMenuItem {
        const name = item.find(selectors.menuItem.name).text().trim();
        const allergens: string[] = CheerioUtil.mapChildrenToString($, item.find(selectors.allergens.individual));
        const preferences: string[] = CheerioUtil.convertChildrenListToStrings($, item.find(selectors.menuItem.diningPrefs));

        return {name, allergens, preferences};
    }

    parse($: CheerioStatic): IDiningHallMenu[] {
        const venuesByMeal: { [key: string]: IDiningHallVenue[] } = {};

        for (const mealTime of mealTimeOrder) {
            venuesByMeal[mealTime] = [];
        }

        const venueGroups = $(selectors.venue.group);

        venueGroups.each((venueIndex, venueElement) => {
            const venueGroupSelector = $(venueElement);

            const venueName = venueGroupSelector.find(selectors.venue.title).text().trim();
            const description = venueGroupSelector.find(selectors.venue.description).text().trim() || undefined;

            const menuElementsSelector = venueGroupSelector.find(selectors.individualMenu.group);

            const itemsByMeal: { [key: string]: IMenuItem[] } = {};

            menuElementsSelector.each((mealIndex, mealElement) => {
                const mealSelector = $(mealElement);

                const mealTime = mealSelector.find(selectors.individualMenu.mealTime).text().trim();

                const items: IMenuItem[] = [];

                const menuItems = mealSelector.find(selectors.individualMenu.menuItems);

                menuItems.each((menuItemIndex, menuItemElement) => {
                    const menuItemSelector = $(menuItemElement);

                    items.push(this.parseMenuItem($, menuItemSelector));
                });

                itemsByMeal[mealTime] = items;
            });

            for (const mealTime of mealTimeOrder) {
                if (!itemsByMeal.hasOwnProperty(mealTime)) {
                    continue;
                }

                venuesByMeal[mealTime].push({
                    venueName,
                    description,
                    menu: itemsByMeal[mealTime]
                });
            }
        });

        const menus: IDiningHallMenu[] = [];

        for (const mealTime of mealTimeOrder) {
            const venuesForMeal = venuesByMeal[mealTime];

            menus.push({
                closed: venuesForMeal.length === 0,
                venues: venuesForMeal
            });
        }

        return menus;
    }
}