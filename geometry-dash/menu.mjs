export async function localResources(accepted) {
  if (!['127.0.0.1', '[::1]', 'localhost'].includes(location.hostname)) return null;
  const response = await fetch('./local-resources.json', { cache: 'no-store' });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('The local launcher could not find your Steam resources.');
  const { files } = await response.json();
  const entries = await Promise.all(files.filter(name => accepted.has(name)).map(async name => {
    const response = await fetch('./local-assets/' + name);
    if (!response.ok) throw new Error('Could not read ' + name + ' from Steam.');
    return [name, await response.blob()];
  }));
  return new Map(entries);
}

export const menuButtons = [
  ['icons', 'Icon Kit', 'GJ_garageBtn_001.png', '■'],
  ['levels', 'Play', 'GJ_playBtn_001.png', '▶'],
  ['creator', 'Creator', 'GJ_creatorBtn_001.png', '⌁'],
];

export const extraButtons = [
  ['achievements', 'Achievements', 'GJ_achBtn_001.png', '★'],
  ['settings', 'Settings', 'GJ_optionsBtn_001.png', '⚙'],
  ['stats', 'Stats', 'GJ_statsBtn_001.png', '▥'],
];
