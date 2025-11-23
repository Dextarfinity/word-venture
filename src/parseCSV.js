import Papa from "papaparse";

// Generic CSV loader
export async function loadCSV(filePath) {
  const response = await fetch(filePath); // works if CSV is in /public folder
  const text = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true, // uses first row as column names
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (err) => reject(err),
    });
  });
}
