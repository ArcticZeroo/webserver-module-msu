"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Meal;
(function (Meal) {
    Meal["BREAKFAST"] = "Breakfast";
    Meal["LUNCH"] = "Lunch";
    Meal["DINNER"] = "Dinner";
    Meal["LATE_NIGHT"] = "Late Night";
})(Meal || (Meal = {}));
exports.Meal = Meal;
const MealIdentifier = {
    [Meal.BREAKFAST]: 192,
    [Meal.LUNCH]: 190,
    [Meal.DINNER]: 191,
    [Meal.LATE_NIGHT]: 232,
    getByIndex: i => MealIdentifier[Object.keys(MealIdentifier)[i]]
};
exports.MealIdentifier = MealIdentifier;
//# sourceMappingURL=enum.js.map