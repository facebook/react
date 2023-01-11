// App.js

import React from 'react';
import { AppRegistry } from 'react-native';
import PortfolioPage from './PortfolioPage';

const App = () => {
    return (
        <PortfolioPage />
    );
}

AppRegistry.registerComponent('myApp', () => App);
