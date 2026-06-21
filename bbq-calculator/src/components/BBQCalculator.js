import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { calculateCookingTime, celsiusToFahrenheit, fahrenheitToCelsius, MEAT_TYPES, } from '../utils/bbqFormulas';
import './BBQCalculator.css';
export function BBQCalculator() {
    const [meatType, setMeatType] = useState('brisket');
    const [weight, setWeight] = useState(5);
    const [isKg, setIsKg] = useState(false);
    const [tempUnit, setTempUnit] = useState('F');
    const [smokingTemp, setSmokingTemp] = useState(225);
    const [result, setResult] = useState(null);
    const handleCalculate = () => {
        const tempF = tempUnit === 'C' ? celsiusToFahrenheit(smokingTemp) : smokingTemp;
        const calculatedResult = calculateCookingTime(meatType, weight, isKg, tempF);
        setResult(calculatedResult);
    };
    const handleWeightUnitChange = () => {
        setIsKg(!isKg);
        if (!isKg) {
            setWeight(Math.round(weight * 0.453592 * 10) / 10);
        }
        else {
            setWeight(Math.round(weight * 2.20462 * 10) / 10);
        }
    };
    const displayTemp = tempUnit === 'F' ? smokingTemp : fahrenheitToCelsius(smokingTemp);
    return (_jsxs("div", { className: "calculator-container", children: [_jsx("h1", { children: "\uD83D\uDD25 BBQ Smoking Calculator" }), _jsx("p", { className: "subtitle", children: "Calcula tiempo y temperatura para tu ahumado perfecto" }), _jsxs("div", { className: "input-section", children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "meatType", children: "Tipo de Carne" }), _jsx("select", { id: "meatType", value: meatType, onChange: (e) => setMeatType(e.target.value), children: MEAT_TYPES.map((meat) => (_jsx("option", { value: meat.value, children: meat.label }, meat.value))) })] }), _jsxs("div", { className: "form-group weight-group", children: [_jsx("label", { htmlFor: "weight", children: "Peso" }), _jsxs("div", { className: "weight-input-group", children: [_jsx("input", { id: "weight", type: "number", value: weight, onChange: (e) => setWeight(parseFloat(e.target.value) || 0), min: "0.1", step: "0.1" }), _jsx("button", { className: "unit-toggle", onClick: handleWeightUnitChange, title: "Cambiar unidad", children: isKg ? 'kg' : 'lbs' })] })] }), _jsxs("div", { className: "form-group temp-group", children: [_jsx("label", { htmlFor: "smokingTemp", children: "Temperatura de Ahumado" }), _jsxs("div", { className: "temp-input-group", children: [_jsx("input", { id: "smokingTemp", type: "number", value: displayTemp, onChange: (e) => setSmokingTemp(parseFloat(e.target.value) || 0), min: "150", max: "350", step: "5" }), _jsxs("button", { className: "unit-toggle", onClick: () => setTempUnit(tempUnit === 'F' ? 'C' : 'F'), children: ["\u00B0", tempUnit] })] })] }), _jsx("button", { className: "calculate-btn", onClick: handleCalculate, children: "Calcular" })] }), result && (_jsxs("div", { className: "results-section", children: [_jsxs("div", { className: "result-header", children: [_jsx("h2", { children: result.meatName }), _jsxs("p", { className: "result-weight", children: [result.weightLbs, " lbs (", result.weightKg, " kg) \u2022 ", result.smokingTemp, "\u00B0F"] })] }), _jsxs("div", { className: "result-cards", children: [_jsxs("div", { className: "card primary", children: [_jsx("h3", { children: "Tiempo de Cocci\u00F3n" }), _jsxs("div", { className: "time-display", children: [_jsxs("span", { className: "hours", children: [result.estimatedCookingTimeHours, "h"] }), _jsxs("span", { className: "minutes", children: [result.estimatedCookingTimeMinutes % 60, "m"] })] }), _jsx("p", { className: "note", children: "Tiempo aproximado de ahumado" })] }), _jsxs("div", { className: "card", children: [_jsx("h3", { children: "Rango de Temperatura Interna" }), _jsxs("div", { className: "temp-range", children: [_jsxs("p", { children: ["M\u00EDnima: ", _jsxs("strong", { children: [result.minInternalTemp, "\u00B0F"] })] }), _jsxs("p", { children: ["\u00D3ptima: ", _jsxs("strong", { children: [result.optimalInternalTemp, "\u00B0F"] })] })] })] }), _jsxs("div", { className: "card", children: [_jsx("h3", { children: "Tiempo de Reposo (Holding)" }), _jsx("div", { className: "holding-time", children: _jsxs("span", { className: "duration", children: [result.holdingDuration, " min"] }) }), _jsx("p", { className: "note", children: "Mantener a 140\u00B0F despu\u00E9s de cocci\u00F3n" })] })] }), _jsxs("div", { className: "temperature-chart", children: [_jsx("h3", { children: "Progresi\u00F3n de Temperatura Interna" }), _jsx("div", { className: "chart-container", children: _jsx("div", { className: "bars", children: result.temperatureRange.map((item, index) => {
                                        const percentage = ((item.temp - result.minInternalTemp) /
                                            (result.optimalInternalTemp - result.minInternalTemp)) * 100;
                                        return (_jsxs("div", { className: "bar-item", children: [_jsx("div", { className: "bar", style: {
                                                        height: `${Math.max(percentage, 5)}%`,
                                                        background: getColorForTemp(item.temp, result.optimalInternalTemp),
                                                    } }), _jsxs("span", { className: "temp-label", children: [item.temp, "\u00B0F"] })] }, index));
                                    }) }) }), _jsx("div", { className: "stages", children: result.temperatureRange.map((item, index) => (_jsxs("div", { className: "stage-item", children: [_jsxs("span", { className: "stage-temp", children: [item.temp, "\u00B0F:"] }), _jsx("span", { className: "stage-name", children: item.stage })] }, index))) })] }), _jsxs("div", { className: "tips-section", children: [_jsx("h3", { children: "\uD83D\uDCA1 Consejos" }), _jsxs("ul", { children: [_jsx("li", { children: "Usa un term\u00F3metro de carne confiable para verificar la temperatura interna" }), _jsx("li", { children: "El \"wrap\" con papel aluminio a los 165\u00B0F acelera la cocci\u00F3n y previene resecamiento" }), _jsx("li", { children: "Los tiempos son aproximados; factores como viento y humedad afectan la cocci\u00F3n" }), _jsx("li", { children: "Reposa la carne en una caja de aislante a 140\u00B0F para distribuir jugos" }), _jsx("li", { children: "Mant\u00E9n la temperatura consistente durante todo el ahumado" })] })] })] }))] }));
}
function getColorForTemp(temp, optimalTemp) {
    const percentage = (temp / optimalTemp) * 100;
    if (percentage < 50)
        return '#FF6B6B';
    if (percentage < 75)
        return '#FFD93D';
    if (percentage < 90)
        return '#6BCB77';
    return '#4D96FF';
}
