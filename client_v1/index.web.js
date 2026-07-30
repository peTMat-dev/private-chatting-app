import { AppRegistry } from 'react-native';
import App from './App';

AppRegistry.registerComponent('App', () => App);

const rootTag = document.getElementById('root');

AppRegistry.runApplication('App', {
rootTag,
});