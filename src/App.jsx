import { useState } from 'react';
import BMICalculator from './components/BMICalculator';
function App() {
 const [darkMode, setDarkMode] = useState(false);
 return (
 <div style={{
 minHeight: '100vh',
 background: darkMode
 ? 'linear-gradient(135deg, #1a0a0f 0%, #2d1020 40%, #1a0a2e 100%)'
 : 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 40%, #f3e5f5 100%)',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 padding: '1rem',
 transition: 'background 0.5s ease'
 }}>
 <BMICalculator darkMode={darkMode} setDarkMode={setDarkMode} />
 </div>
 );
}
export default App;