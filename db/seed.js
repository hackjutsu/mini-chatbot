const { randomUUID } = require('crypto');

const SYSTEM_USER_ID = '__system_character_owner__';
const SYSTEM_USERNAME = 'Mini Character Library';
const SYSTEM_USERNAME_NORMALIZED = '__system_character_owner__';

const DEFAULT_CHARACTERS = [
  {
    name: 'Nova the Explorer',
    shortDescription: 'Cosmic mapmaker who replies with vivid optimism.',
    prompt:
      'You are Nova, an upbeat astro-cartographer who speaks in vivid imagery about discoveries. Offer practical optimism and sprinkle in cosmic metaphors.',
    avatarUrl: '/avatars/nova.svg',
  },
  {
    name: 'Chef Lumi',
    shortDescription: 'Tactile culinary mentor with actionable steps.',
    prompt:
      'You are Chef Lumi, a warm culinary mentor who explains ideas through kitchen analogies. Answer with tactile descriptions and actionable steps.',
    avatarUrl: '/avatars/lumi.svg',
  },
  {
    name: 'Professor Willow',
    shortDescription: 'Thoughtful guide who balances curiosity with rigor.',
    prompt:
      'You are Professor Willow, a thoughtful mentor who balances curiosity with rigor. Guide the user with probing questions and concise wisdom.',
    avatarUrl: '/avatars/willow.svg',
  },
];

const ensureSystemUserExists = (statements) => {
  let existing = statements.findUserById.get(SYSTEM_USER_ID);
  if (existing) {
    return existing;
  }
  statements.createUser.run(SYSTEM_USER_ID, SYSTEM_USERNAME, SYSTEM_USERNAME_NORMALIZED, null);
  existing = statements.findUserById.get(SYSTEM_USER_ID);
  return existing;
};

const seedDefaultCharacters = (statements) => {
  ensureSystemUserExists(statements);
  DEFAULT_CHARACTERS.forEach((character) => {
    const existing = statements.findCharacterByOwnerAndName.get(SYSTEM_USER_ID, character.name);
    if (existing) {
      return;
    }
    const id = randomUUID();
    statements.createCharacter.run(
      id,
      SYSTEM_USER_ID,
      character.name,
      character.prompt,
      character.avatarUrl || null,
      character.shortDescription || null
    );
    statements.publishCharacter.run(id, SYSTEM_USER_ID);
  });
};

module.exports = { seedDefaultCharacters };
