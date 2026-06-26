import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initThemeColor, initThemeMode } from './utils/themeManager'

initThemeColor();
initThemeMode();


createRoot(document.getElementById("root")!).render(<App />);

