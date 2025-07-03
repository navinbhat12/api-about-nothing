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

const app = express();
const PORT = process.env.PORT || 3000;

const charactersPath = path.join(__dirname, "data", "characters.json");
const characters: Character[] = JSON.parse(
  fs.readFileSync(charactersPath, "utf-8")
);

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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
