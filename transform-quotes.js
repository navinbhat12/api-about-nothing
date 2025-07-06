const fs = require("fs");
const path = require("path");

// Read the data files
const charactersPath = path.join(__dirname, "src", "data", "characters.json");
const episodesPath = path.join(__dirname, "src", "data", "episodes.json");
const quotesPath = path.join(__dirname, "src", "data", "quotes.json");

const characters = JSON.parse(fs.readFileSync(charactersPath, "utf-8"));
const episodes = JSON.parse(fs.readFileSync(episodesPath, "utf-8"));
const quotes = JSON.parse(fs.readFileSync(quotesPath, "utf-8"));

// Create a mapping from character names to character data
const characterMap = {};
characters.forEach((char) => {
  characterMap[char.name] = {
    name: char.name,
    url: `/characters/${char.id}`,
  };
});

// Create a mapping from author names to character names
const authorToCharacterNameMap = {
  Jerry: "Jerry Seinfeld",
  George: "George Costanza",
  Elaine: "Elaine Benes",
  Kramer: "Cosmo Kramer",
  Newman: "Newman",
  "Alton Benes(Elaines Father)": "Alton Benes",
  "Antonio(The Busboy)": "Antonio",
  "Jerry's Mom": "Helen Seinfeld",
  Morty: "Morty Seinfeld",
  "TV Kramer (to George)": "Cosmo Kramer",
  // Add more mappings as you add characters to characters.json
};

// Create a mapping from season/episode to episode data for existing episodes
const episodeMap = {};
episodes.forEach((episode) => {
  const episodeNumber = episode.episode; // e.g., "S1E01"
  const season = episodeNumber.substring(1, 2);
  const ep = episodeNumber.substring(3, 5);
  const key = `${season}-${ep}`;
  episodeMap[key] = {
    name: episode.name,
    url: `/episodes/${episode.id}`,
  };
});

// Calculate episode ID based on season and episode number
function calculateEpisodeId(season, episode) {
  const episodesPerSeason = {
    1: 5,
    2: 12,
    3: 23,
    4: 24,
    5: 22,
    6: 24,
    7: 24,
    8: 22,
    9: 24,
  };

  let episodeId = 1; // Start from 1

  // Add episodes from previous seasons
  for (let s = 1; s < season; s++) {
    episodeId += episodesPerSeason[s] || 0;
  }

  // Add episodes from current season
  episodeId += parseInt(episode) - 1;

  return episodeId;
}

// Transform quotes
const transformedQuotes = quotes
  .map((quote) => {
    // Get character name from author
    const characterName = authorToCharacterNameMap[quote.author];

    // Skip if character doesn't exist in our data
    if (!characterName || !characterMap[characterName]) {
      return null; // This quote will be filtered out
    }

    const characterData = characterMap[characterName];

    // Get episode data
    const episodeKey = `${quote.season}-${quote.episode.padStart(2, "0")}`;
    let episodeData;

    if (episodeMap[episodeKey]) {
      // Episode exists in episodes.json
      episodeData = episodeMap[episodeKey];
    } else {
      // Calculate episode ID and create placeholder data
      const episodeId = calculateEpisodeId(
        parseInt(quote.season),
        parseInt(quote.episode)
      );
      episodeData = {
        name: `Season ${quote.season} Episode ${quote.episode}`,
        url: `/episodes/${episodeId}`,
      };
    }

    // Clean up the quote text (remove template literals and fix formatting)
    let cleanQuote = quote.quote;
    if (cleanQuote.startsWith("`") && cleanQuote.endsWith("`")) {
      cleanQuote = cleanQuote.slice(1, -1);
    }

    // Replace multiple quotes with proper formatting
    cleanQuote = cleanQuote.replace(/"/g, '"').replace(/"/g, '"');

    return {
      quote: cleanQuote,
      character: characterData,
      episode: episodeData,
    };
  })
  .filter((quote) => quote !== null); // Remove null entries (unmapped characters)

// Write the transformed quotes to a new file
const outputPath = path.join(
  __dirname,
  "src",
  "data",
  "quotes-transformed.json"
);
fs.writeFileSync(outputPath, JSON.stringify(transformedQuotes, null, 2));

console.log(
  `Transformed ${transformedQuotes.length} quotes (out of ${quotes.length} total)`
);
console.log(`Output saved to: ${outputPath}`);

// Generate a report of unmapped characters
const unmappedCharacters = new Set();
quotes.forEach((quote) => {
  const characterName = authorToCharacterNameMap[quote.author];
  if (!characterName || !characterMap[characterName]) {
    unmappedCharacters.add(quote.author);
  }
});

if (unmappedCharacters.size > 0) {
  console.log(
    "\nUnmapped characters that need to be added to characters.json:"
  );
  Array.from(unmappedCharacters).forEach((char) => {
    console.log(`- ${char}`);
  });
}

// Generate a report of missing episodes
const missingEpisodes = new Set();
quotes.forEach((quote) => {
  const episodeKey = `${quote.season}-${quote.episode.padStart(2, "0")}`;
  if (!episodeMap[episodeKey]) {
    missingEpisodes.add(episodeKey);
  }
});

if (missingEpisodes.size > 0) {
  console.log("\nEpisodes that need to be added to episodes.json:");
  Array.from(missingEpisodes).forEach((ep) => {
    const [season, episode] = ep.split("-");
    const episodeId = calculateEpisodeId(parseInt(season), parseInt(episode));
    console.log(`- ${ep} (calculated ID: ${episodeId})`);
  });
}

// Show which characters are currently supported
console.log("\nCurrently supported characters:");
Object.keys(authorToCharacterNameMap).forEach((author) => {
  const characterName = authorToCharacterNameMap[author];
  if (characterMap[characterName]) {
    console.log(`✓ ${author} -> ${characterName}`);
  } else {
    console.log(`✗ ${author} -> ${characterName} (not in characters.json)`);
  }
});
