import { existsSync, readFileSync } from 'node:fs';

const removedComponent = 'src/components/OpenStreetMap.tsx';
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const dependencyNames = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
};

if (existsSync(removedComponent)) {
  throw new Error(`${removedComponent} must not be restored; checkout uses Google Places Autocomplete.`);
}

for (const dependency of ['react-leaflet', 'leaflet', '@types/leaflet']) {
  if (dependency in dependencyNames) {
    throw new Error(`${dependency} is a legacy draggable-map dependency and must remain removed.`);
  }
}

console.log('Legacy OpenStreetMap component and Leaflet dependencies are absent.');
