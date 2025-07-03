import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";

interface Character {
  id: number;
  name: string;
  img: string;
  blurb: string;
  episodes: { name: string; url: string }[];
}

interface Episode {
  id: number;
  name: string;
  img: string;
  episode: string;
  blurb: string;
  characters: { name: string; url: string }[];
  quotes: { character: string; quote: string }[];
}

const MAIN_CHARACTERS = ["Jerry", "George", "Elaine", "Kramer"];
const EPISODES_PATH = path.join(__dirname, "../src/data/episodes.json");
const CHARACTERS_PATH = path.join(__dirname, "../src/data/characters.json");

// Helper to load JSON
function loadJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

// Helper to save JSON
function saveJson(filePath: string, data: any) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function titleFromSlug(slug: string): string {
  return slug.replace(".htm", "").replace(/([a-z])([A-Z])/g, "$1 $2");
}

async function scrapeEpisode(slug: string) {
  const url = `https://seinfeldscripts.com/${slug}`;
  const { data: html } = await axios.get(url);
  const $ = cheerio.load(html);
  const text = $("body").text();

  // Use the same extraction logic as extractNamesFromEpisode.ts
  const lines = text.split("\n");
  const speakerMatches = lines
    .map((line) => line.trim())
    .filter((line) => /^[A-Za-z][A-Za-z\s\.\-']*:\s/.test(line))
    .map((line) => line.split(":")[0]);

  const charactersJson: Character[] = loadJson(CHARACTERS_PATH);
  const foundNames = Array.from(new Set(speakerMatches));

  // Debug: Log what we found
  console.log("🔍 Found character names in script:", foundNames);

  const filteredCharacters = charactersJson.filter((char) => {
    const firstName = char.name.split(" ")[0];
    const isFound = foundNames.some(
      (name) => name.toLowerCase() === firstName.toLowerCase()
    );
    const isNotMain = !MAIN_CHARACTERS.includes(firstName);

    // Debug: Log each character check
    console.log(
      `🔍 Checking ${char.name}: firstName="${firstName}", isFound=${isFound}, isNotMain=${isNotMain}`
    );

    return isFound && isNotMain;
  });

  const newCharactersList = filteredCharacters.map((char) => ({
    name: char.name,
    url: `/characters/${char.id}`,
  }));

  // Add episode to character's episodes list
  const episodeTitle = titleFromSlug(slug);
  const episodeUrl = `/episodes/${episodeTitle
    .replace(/\s+/g, "-")
    .toLowerCase()}`;

  filteredCharacters.forEach((char) => {
    if (!char.episodes.some((ep) => ep.name === episodeTitle)) {
      char.episodes.push({ name: episodeTitle, url: episodeUrl });
    }
  });

  const episodesJson: Episode[] = loadJson(EPISODES_PATH);
  const nextId = episodesJson.length + 1;

  const newEpisode: Episode = {
    id: nextId,
    name: episodeTitle,
    img: "",
    episode: "",
    blurb: "",
    characters: newCharactersList,
    quotes: [
      { character: "", quote: "" },
      { character: "", quote: "" },
    ],
  };

  episodesJson.push(newEpisode);
  saveJson(EPISODES_PATH, episodesJson);
  saveJson(CHARACTERS_PATH, charactersJson);

  console.log("✅ Episode and character data successfully updated.");
}

// ========================================
// USAGE: Replace 'TheSeinfeldChronicles.htm' with your script slug
// Example: node tools/generateEpisodeData.ts TheSeinfeldChronicles.htm
// ========================================
const inputSlug = process.argv[2];
if (!inputSlug) {
  console.error(
    "❌ Please provide a script slug, e.g., TheSeinfeldChronicles.htm"
  );
  process.exit(1);
}

scrapeEpisode(inputSlug);
