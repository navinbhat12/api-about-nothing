import express from "express";
import path from "path";
import fs from "fs";

interface Character {
  id: number;
  name: string;
  img: string;
  blurb: string;
  episodes: any;
}

interface Episode {
  id: number;
  name: string;
  img: string;
  episode: string;
  blurb: string;
  characters: any[];
  quotes: any[];
}

const app = express();
const PORT = process.env.PORT || 3000;

const charactersPath = path.join(__dirname, "data", "characters.json");
const episodesPath = path.join(__dirname, "data", "episodes.json");
const characters: Character[] = JSON.parse(
  fs.readFileSync(charactersPath, "utf-8")
);
const episodes: Episode[] = JSON.parse(fs.readFileSync(episodesPath, "utf-8"));

app.get("/", (_req, res) => {
  res.send("Welcome to the Seinfeld API!");
});

app.get("/characters", (req, res) => {
  const nameFilter = req.query.name as string | undefined;

  let filteredCharacters = characters;

  if (nameFilter) {
    filteredCharacters = characters.filter((char: Character) =>
      char.name.toLowerCase().includes(nameFilter.toLowerCase())
    );
  }

  res.json(filteredCharacters);
});

app.get("/characters/:id", ((req, res) => {
  const id = parseInt(req.params.id);
  const character = characters.find((char) => char.id === id);

  if (!character) {
    return res.status(404).json({ error: "Character not found" });
  }

  res.json(character);
}) as express.Handler);

app.get("/episodes", (req, res) => {
  const nameFilter = req.query.name as string | undefined;
  const seasonFilter = req.query.season as string | undefined;

  let filteredEpisodes = episodes;

  if (nameFilter) {
    filteredEpisodes = episodes.filter((ep: Episode) =>
      ep.name.toLowerCase().includes(nameFilter.toLowerCase())
    );
  }

  if (seasonFilter) {
    filteredEpisodes = episodes.filter((ep: Episode) =>
      ep.episode.startsWith(`S${seasonFilter}`)
    );
  }

  res.json(filteredEpisodes);
});

app.get("/episodes/:id", ((req, res) => {
  const id = parseInt(req.params.id);
  const episode = episodes.find((ep) => ep.id === id);

  if (!episode) {
    return res.status(404).json({ error: "Episode not found" });
  }

  res.json(episode);
}) as express.Handler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
