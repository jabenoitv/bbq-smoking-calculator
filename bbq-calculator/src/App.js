import { jsx as _jsx } from "react/jsx-runtime";
import { BBQCalculator } from './components/BBQCalculator';
import './App.css';
function App() {
    return (_jsx("div", { className: "app", children: _jsx(BBQCalculator, {}) }));
}
export default App;
