import React, {createContext, useContext, useState} from 'react';

const Theme = createContext('light');

export default Theme;

export function ThemeToggleButton({onChange}) {
  let theme = useContext(Theme);
  let [targetTheme, setTargetTheme] = useState(theme);
  function toggleTheme() {
    let newTheme = theme === 'light' ? 'dark' : 'light';
    // High pri, responsive update.
    setTargetTheme(newTheme);
    // Perform the actual theme change in a separate update.
    setTimeout(() => onChange(newTheme), 0);
  }
  if (targetTheme !== theme) {
    return 'Switching to ' + targetTheme + '...';
  }
  return (
    <a className="link" onClick={toggleTheme}>
      Switch to {theme === 'light' ? 'Dark' : 'Light'} theme
    </a>
  );
}
