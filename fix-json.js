const fs = require("fs");
const path = require("path");

// Read the quotes file as a string
const quotesPath = path.join(__dirname, "src", "data", "quotes.json");
let quotesContent = fs.readFileSync(quotesPath, "utf-8");

// Fix template literals (backticks)
quotesContent = quotesContent.replace(/`([^`]*)`/g, (match, content) => {
  // Escape quotes and newlines
  return '"' + content.replace(/"/g, '\\"').replace(/\n/g, "\\n") + '"';
});

// Fix the specific character issue
quotesContent = quotesContent.replace(/George\t/g, "George");

// Fix any remaining invalid characters
quotesContent = quotesContent.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");

// Write the fixed content back
fs.writeFileSync(quotesPath, quotesContent);

console.log("Fixed JSON syntax errors in quotes.json");
