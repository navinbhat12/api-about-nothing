import axios from "axios";
import * as cheerio from "cheerio";

const EPISODE_URL = "https://seinfeldscripts.com/TheStockTip.htm";

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

    console.log(`📝 Found ${uniqueNames.length} character name(s):`);
    uniqueNames.forEach((name) => console.log(`- ${name}`));
  } catch (err) {
    console.error("❌ Error scraping script:", err);
  }
}

extractCharacterNames();
