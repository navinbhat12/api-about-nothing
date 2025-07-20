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

interface Quote {
  quote: string;
  character: {
    name: string;
    url: string;
  };
  episode: {
    name: string;
    url: string;
  };
}

const app = express();
const PORT = process.env.PORT || 3000;

const charactersPath = path.join(__dirname, "data", "characters.json");
const episodesPath = path.join(__dirname, "data", "episodes.json");
const quotesPath = path.join(__dirname, "data", "quotes-transformed.json");

const characters: Character[] = JSON.parse(
  fs.readFileSync(charactersPath, "utf-8")
);
const episodes: Episode[] = JSON.parse(fs.readFileSync(episodesPath, "utf-8"));
const quotes: Quote[] = JSON.parse(fs.readFileSync(quotesPath, "utf-8"));

app.get("/", (_req, res) => {
  const mainCharacters = characters.filter((char: Character) =>
    ["jerry", "elaine", "george", "kramer"].some((name) =>
      char.name.toLowerCase().includes(name.toLowerCase())
    )
  );
  res.json(mainCharacters);
});

app.get("/characters", (req, res) => {
  const nameFilter = req.query.name as string | undefined;
  const page = parseInt(req.query.page as string) || 1;
  const limit = 20; // Hard page limit

  let filteredCharacters = characters;

  if (nameFilter) {
    filteredCharacters = characters.filter((char: Character) =>
      char.name.toLowerCase().includes(nameFilter.toLowerCase())
    );
  }

  const count = filteredCharacters.length;
  const pages = Math.ceil(count / limit);
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedResults = filteredCharacters.slice(start, end);
  // Use x-forwarded-proto for protocol, default to https in production
  let protocol = (req.headers["x-forwarded-proto"] as string) || req.protocol;
  if (process.env.VERCEL || process.env.NODE_ENV === "production")
    protocol = "https";
  const baseUrl = protocol + "://" + req.get("host") + req.path;
  const nextPage =
    page < pages
      ? `${baseUrl}?page=${page + 1}${
          nameFilter ? `&name=${encodeURIComponent(nameFilter)}` : ""
        }`
      : null;
  const prevPage =
    page > 1
      ? `${baseUrl}?page=${page - 1}${
          nameFilter ? `&name=${encodeURIComponent(nameFilter)}` : ""
        }`
      : null;

  res.json({
    info: { count, pages, next_page: nextPage, prev_page: prevPage },
    results: paginatedResults,
  });
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
  const page = parseInt(req.query.page as string) || 1;
  const limit = 20; // Hard page limit

  let filteredEpisodes = episodes;

  if (nameFilter) {
    filteredEpisodes = filteredEpisodes.filter((ep: Episode) =>
      ep.name.toLowerCase().includes(nameFilter.toLowerCase())
    );
  }

  if (seasonFilter) {
    filteredEpisodes = filteredEpisodes.filter((ep: Episode) =>
      ep.episode.startsWith(`S${seasonFilter}`)
    );
  }

  const count = filteredEpisodes.length;
  const pages = Math.ceil(count / limit);
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedResults = filteredEpisodes.slice(start, end);
  let protocol = (req.headers["x-forwarded-proto"] as string) || req.protocol;
  if (process.env.VERCEL || process.env.NODE_ENV === "production")
    protocol = "https";
  const baseUrl = protocol + "://" + req.get("host") + req.path;
  const nextPage =
    page < pages
      ? `${baseUrl}?page=${page + 1}${
          nameFilter ? `&name=${encodeURIComponent(nameFilter)}` : ""
        }${seasonFilter ? `&season=${encodeURIComponent(seasonFilter)}` : ""}`
      : null;
  const prevPage =
    page > 1
      ? `${baseUrl}?page=${page - 1}${
          nameFilter ? `&name=${encodeURIComponent(nameFilter)}` : ""
        }${seasonFilter ? `&season=${encodeURIComponent(seasonFilter)}` : ""}`
      : null;

  res.json({
    info: { count, pages, next_page: nextPage, prev_page: prevPage },
    results: paginatedResults,
  });
});

app.get("/episodes/:id", ((req, res) => {
  const id = parseInt(req.params.id);
  const episode = episodes.find((ep) => ep.id === id);

  if (!episode) {
    return res.status(404).json({ error: "Episode not found" });
  }

  res.json(episode);
}) as express.Handler);

// Quotes endpoints
app.get("/quotes", (req, res) => {
  const authorFilter = req.query.author as string | undefined;
  const episodeFilter = req.query.episode as string | undefined;
  const quoteFilter = req.query.quote as string | undefined;
  const page = parseInt(req.query.page as string) || 1;
  const limit = 20; // Hard page limit

  let filteredQuotes = quotes;

  // Filter by author (partial name match)
  if (authorFilter) {
    filteredQuotes = filteredQuotes.filter((quote: Quote) =>
      quote.character.name.toLowerCase().includes(authorFilter.toLowerCase())
    );
  }

  // Filter by episode (partial name match)
  if (episodeFilter) {
    filteredQuotes = filteredQuotes.filter((quote: Quote) =>
      quote.episode.name.toLowerCase().includes(episodeFilter.toLowerCase())
    );
  }

  // Filter by quote content (partial text match)
  if (quoteFilter) {
    filteredQuotes = filteredQuotes.filter((quote: Quote) =>
      quote.quote.toLowerCase().includes(quoteFilter.toLowerCase())
    );
  }

  const count = filteredQuotes.length;
  const pages = Math.ceil(count / limit);
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedResults = filteredQuotes.slice(start, end);
  let protocol = (req.headers["x-forwarded-proto"] as string) || req.protocol;
  if (process.env.VERCEL || process.env.NODE_ENV === "production")
    protocol = "https";
  const baseUrl = protocol + "://" + req.get("host") + req.path;
  const nextPage =
    page < pages
      ? `${baseUrl}?page=${page + 1}${
          authorFilter ? `&author=${encodeURIComponent(authorFilter)}` : ""
        }${
          episodeFilter ? `&episode=${encodeURIComponent(episodeFilter)}` : ""
        }${quoteFilter ? `&quote=${encodeURIComponent(quoteFilter)}` : ""}`
      : null;
  const prevPage =
    page > 1
      ? `${baseUrl}?page=${page - 1}${
          authorFilter ? `&author=${encodeURIComponent(authorFilter)}` : ""
        }${
          episodeFilter ? `&episode=${encodeURIComponent(episodeFilter)}` : ""
        }${quoteFilter ? `&quote=${encodeURIComponent(quoteFilter)}` : ""}`
      : null;

  res.json({
    info: { count, pages, next_page: nextPage, prev_page: prevPage },
    results: paginatedResults,
  });
});

app.get("/quotes/character/:characterId", ((req, res) => {
  const characterId = parseInt(req.params.characterId);

  // Find the character to get their name
  const character = characters.find((char) => char.id === characterId);

  if (!character) {
    return res.status(404).json({ error: "Character not found" });
  }

  // Filter quotes by character name
  const characterQuotes = quotes.filter(
    (quote: Quote) => quote.character.name === character.name
  );

  res.json(characterQuotes);
}) as express.Handler);

app.get("/quotes/episode/:episodeId", ((req, res) => {
  const episodeId = parseInt(req.params.episodeId);

  // Find the episode to get its name
  const episode = episodes.find((ep) => ep.id === episodeId);

  if (!episode) {
    return res.status(404).json({ error: "Episode not found" });
  }

  // Filter quotes by episode name
  const episodeQuotes = quotes.filter(
    (quote: Quote) => quote.episode.name === episode.name
  );

  res.json(episodeQuotes);
}) as express.Handler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
