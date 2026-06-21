const MEAT_FORMULAS = {
    brisket: {
        nameEs: 'Brisket',
        timePerPound: 1.5,
        timePerKg: 3.3,
        minInternalTemp: 190,
        optimalInternalTemp: 205,
        holdingDuration: 60,
    },
    pork_butt: {
        nameEs: 'Pork Butt',
        timePerPound: 2,
        timePerKg: 4.4,
        minInternalTemp: 190,
        optimalInternalTemp: 205,
        holdingDuration: 90,
    },
    ribs: {
        nameEs: 'Costillas (Ribs)',
        timePerPound: 0.5,
        timePerKg: 1.1,
        minInternalTemp: 190,
        optimalInternalTemp: 200,
        holdingDuration: 15,
    },
    pork_shoulder: {
        nameEs: 'Pork Shoulder',
        timePerPound: 2,
        timePerKg: 4.4,
        minInternalTemp: 190,
        optimalInternalTemp: 205,
        holdingDuration: 90,
    },
    beef_ribs: {
        nameEs: 'Costillas de Res (Beef Ribs)',
        timePerPound: 1.25,
        timePerKg: 2.75,
        minInternalTemp: 190,
        optimalInternalTemp: 205,
        holdingDuration: 30,
    },
    chicken: {
        nameEs: 'Pollo',
        timePerPound: 0.75,
        timePerKg: 1.65,
        minInternalTemp: 165,
        optimalInternalTemp: 165,
        holdingDuration: 10,
    },
    turkey: {
        nameEs: 'Pavo',
        timePerPound: 0.75,
        timePerKg: 1.65,
        minInternalTemp: 165,
        optimalInternalTemp: 165,
        holdingDuration: 20,
    },
};
export function calculateCookingTime(meatType, weight, isKg, smokingTempF) {
    const formula = MEAT_FORMULAS[meatType];
    const weightLbs = isKg ? weight * 2.20462 : weight;
    const weightKg = isKg ? weight : weight / 2.20462;
    const cookingTimeHours = weightLbs * formula.timePerPound;
    const cookingTimeMinutes = Math.round(cookingTimeHours * 60);
    // Ajuste por temperatura de ahumado
    const tempAdjustment = (smokingTempF - 225) / 25; // -1 por cada 25°F menos
    const adjustedCookingHours = Math.max(cookingTimeHours * (1 - tempAdjustment * 0.05), cookingTimeHours * 0.8);
    const temperatureRange = generateTemperatureProgression(formula.minInternalTemp, formula.optimalInternalTemp, 10);
    return {
        meatName: formula.nameEs,
        weightLbs: Math.round(weightLbs * 100) / 100,
        weightKg: Math.round(weightKg * 100) / 100,
        smokingTemp: smokingTempF,
        estimatedCookingTimeHours: Math.round(adjustedCookingHours),
        estimatedCookingTimeMinutes: Math.round(adjustedCookingHours * 60),
        minInternalTemp: formula.minInternalTemp,
        optimalInternalTemp: formula.optimalInternalTemp,
        holdingDuration: formula.holdingDuration,
        temperatureRange,
    };
}
function generateTemperatureProgression(minTemp, maxTemp, steps) {
    const result = [];
    const step = (maxTemp - minTemp) / steps;
    for (let i = 0; i <= steps; i++) {
        const temp = minTemp + step * i;
        let stage = '';
        if (temp < minTemp + step * 3) {
            stage = 'Cociendo';
        }
        else if (temp < minTemp + step * 7) {
            stage = 'Cocimiento avanzado';
        }
        else if (temp === maxTemp) {
            stage = 'Listo';
        }
        else {
            stage = 'Casi listo';
        }
        result.push({ temp: Math.round(temp), stage });
    }
    return result;
}
export function celsiusToFahrenheit(celsius) {
    return Math.round((celsius * 9) / 5 + 32);
}
export function fahrenheitToCelsius(fahrenheit) {
    return Math.round(((fahrenheit - 32) * 5) / 9 * 10) / 10;
}
export const MEAT_TYPES = [
    { value: 'brisket', label: MEAT_FORMULAS.brisket.nameEs },
    { value: 'pork_butt', label: MEAT_FORMULAS.pork_butt.nameEs },
    { value: 'pork_shoulder', label: MEAT_FORMULAS.pork_shoulder.nameEs },
    { value: 'ribs', label: MEAT_FORMULAS.ribs.nameEs },
    { value: 'beef_ribs', label: MEAT_FORMULAS.beef_ribs.nameEs },
    { value: 'chicken', label: MEAT_FORMULAS.chicken.nameEs },
    { value: 'turkey', label: MEAT_FORMULAS.turkey.nameEs },
];
