import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";

const EPISODES_PATH = path.join(__dirname, "../src/data/episodes.json");
const BASE_URL = "https://seinfeldscripts.com/seinfeld-season-";

function normalizeTitle(title: string): string {
  return title
    .replace(/\s*\-\s*PILOT/i, "") // Remove ' - PILOT' if present
    .replace(/[^a-zA-Z]/g, "") // Remove non-alphabetic characters (including numbers)
    .toLowerCase();
}

const seasonArg = process.argv[2];
if (!seasonArg) {
  console.error("❌ Please provide a season number, e.g., 1");
  process.exit(1);
}
const season = parseInt(seasonArg, 10);
if (isNaN(season) || season < 1 || season > 9) {
  console.error(
    "❌ Invalid season number. Please provide a number between 1 and 9."
  );
  process.exit(1);
}

async function updateEpisodeBlurbs() {
  const episodesJson = JSON.parse(fs.readFileSync(EPISODES_PATH, "utf-8"));
  let updatedCount = 0;

  // Print all episode names and their normalized forms
  console.log("\nEpisodes in episodes.json:");
  episodesJson.forEach((ep: any) => {
    console.log(`- ${ep.name} => ${normalizeTitle(ep.name)}`);
  });

  const url = `${BASE_URL}${season}.html`;
  console.log(`\nFetching: ${url}`);
  const { data: html } = await axios.get(url);
  const $ = cheerio.load(html);
  const fullText = $("body").text();

  // Revert to previous regex
  const episodeRegex =
    /([A-Z0-9\-\s]+)\n*\(Episode \d+\):([\s\S]*?)(?=Air Date:|$)/g;
  let match;
  while ((match = episodeRegex.exec(fullText)) !== null) {
    const rawTitle = match[1].replace(/\n/g, " ").trim();
    const blurb = match[2].replace(/\n/g, " ").replace(/\s+/g, " ").trim();
    const normTitle = normalizeTitle(rawTitle);
    // Debug output
    console.log("\n---");
    console.log("Raw title:", rawTitle);
    console.log("Normalized scraped title:", normTitle);
    // Compare to each normalized episode name
    episodesJson.forEach((ep: any) => {
      console.log(`Compare to: ${normalizeTitle(ep.name)} (${ep.name})`);
    });
    const epMatch = episodesJson.find(
      (ep: any) => normalizeTitle(ep.name) === normTitle
    );
    if (epMatch) {
      epMatch.blurb = blurb;
      updatedCount++;
      console.log(`Updated blurb for: ${rawTitle}`);
    } else {
      console.log(`No match found in episodes.json for: ${rawTitle}`);
    }
  }

  fs.writeFileSync(
    EPISODES_PATH,
    JSON.stringify(episodesJson, null, 2),
    "utf-8"
  );
  console.log(
    `\n✅ Updated blurbs for ${updatedCount} episodes in season ${season}.`
  );
}

updateEpisodeBlurbs();
