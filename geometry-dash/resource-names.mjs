import { levels } from './library.mjs';

const atlases = ['GJ_GameSheet', 'GJ_GameSheet02', 'GJ_GameSheetIcons'];
const menuAtlases = ['GJ_GameSheet03', 'GJ_GameSheet04', 'GJ_LaunchSheet', 'GJ_GameSheetGlow'];
const commonFiles = [
  'game_bg_01_001.png', 'groundsquare_01_001.png',
  ...atlases.flatMap(name => [name.toLowerCase() + '.plist', name.toLowerCase() + '.png']),
];
const menuFiles = menuAtlases.flatMap(name => [name.toLowerCase() + '.plist', name.toLowerCase() + '.png']);
const effectNames = { dead: 'explode_11.ogg', complete: 'endstart_02.ogg' };
const dragFiles = ['drageffect.plist', 'shipdrageffect.plist', 'square.png'];
const resourceNames = new Set([...commonFiles, ...menuFiles, ...dragFiles, 'menuloop.mp3', 'bigfont.fnt', 'bigfont.png', ...Object.values(effectNames), ...levels.flatMap(entry => [entry.path, entry.song])]);

export { atlases, menuAtlases, commonFiles, dragFiles, effectNames, resourceNames };
