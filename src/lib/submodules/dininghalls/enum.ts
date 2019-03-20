enum Meal {
    BREAKFAST = 0,
    LUNCH,
    DINNER,
    LATE_NIGHT,
    LATE_NIGHT_SNACKS
}

const MealRange = {
    start: Meal.BREAKFAST,
    end: Meal.LATE_NIGHT_SNACKS,
    all: [Meal.BREAKFAST, Meal.LUNCH, Meal.DINNER, Meal.LATE_NIGHT, Meal.LATE_NIGHT_SNACKS]
};

export { Meal, MealRange };