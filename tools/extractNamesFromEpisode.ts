import axios from "axios";
import * as cheerio from "cheerio";
const EPISODE_URL = "https://seinfeldscripts.com/TheParkingGarage.htm";

async function extractCharacterNames() {
  try {
    const { data: html } = await axios.get(EPISODE_URL);
    const $ = cheerio.load(html);

    const fullText = $("body").text();
    const lines = fullText.split("\n");

    const speakerMatches = lines
      .map((line) => line.trim())
      .filter((line) => /^[A-Za-z][A-Za-z\s\.\-']*:\s/.test(line))
      .map((line) => line.split(":")[0]);

    const uniqueNames = Array.from(new Set(speakerMatches)).sort();

    // Filter out main characters
    const mainCharacters = ["Jerry", "Elaine", "George", "Kramer"];
    const filteredNames = uniqueNames.filter(
      (name) =>
        !mainCharacters.some((mainChar) =>
          name.toLowerCase().includes(mainChar.toLowerCase())
        )
    );

    console.log(
      `📝 Found ${uniqueNames.length} total character name(s), ${filteredNames.length} excluding main characters:`
    );
    filteredNames.forEach((name) => console.log(`- ${name}`));
  } catch (err) {
    console.error("❌ Error scraping script:", err);
  }
}

extractCharacterNames();
