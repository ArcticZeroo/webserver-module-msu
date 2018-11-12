enum Meal {
    BREAKFAST ='Breakfast',
    LUNCH = 'Lunch',
    DINNER = 'Dinner',
    LATE_NIGHT = 'Late Night',
    LATE_NIGHT_SNACKS = 'Late Night Snacks'
}

const MealIdentifier: { 'Breakfast': number, 'Lunch': number, 'Dinner': number, 'Late Night': number, 'Late Night Snacks': number, getByIndex: (i: number) => number } = {
    [Meal.BREAKFAST]: 192,
    [Meal.LUNCH]: 190,
    [Meal.DINNER]: 191,
    [Meal.LATE_NIGHT]: 232,
    [Meal.LATE_NIGHT_SNACKS]: 232,
    getByIndex: i => MealIdentifier[Object.keys(MealIdentifier)[i]]
};

export { Meal, MealIdentifier };