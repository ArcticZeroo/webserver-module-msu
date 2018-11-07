enum Meal {
    BREAKFAST ='Breakfast',
    LUNCH = 'Lunch',
    DINNER = 'Dinner',
    LATE_NIGHT = 'Late Night',
}

const MealIdentifier = {
    [Meal.BREAKFAST]: 192,
    [Meal.LUNCH]: 190,
    [Meal.DINNER]: 191,
    [Meal.LATE_NIGHT]: 232,
    getByIndex: i => MealIdentifier[Object.keys(MealIdentifier)[i]]
};

export { Meal, MealIdentifier };