// Basic mapping for Uz Latin <-> Cyrillic
const latToCyrMap: Record<string, string> = {
  "sh": "ш", "ch": "ч", "o'": "ў", "g'": "ғ", "ya": "я", "yu": "ю", "yo": "ё", "ts": "ц",
  "Sh": "Ш", "Ch": "Ч", "O'": "Ў", "G'": "Ғ", "Ya": "Я", "Yu": "Ю", "Yo": "Ё", "Ts": "Ц",
  "a": "а", "b": "б", "d": "д", "e": "е", "f": "ф", "g": "г", "h": "ҳ", "i": "и", "j": "ж",
  "k": "к", "l": "л", "m": "м", "n": "н", "o": "о", "p": "п", "q": "қ", "r": "р", "s": "с",
  "t": "т", "u": "у", "v": "в", "x": "х", "y": "й", "z": "з", "'": "ъ"
};

const cyrToLatMap: Record<string, string> = Object.entries(latToCyrMap).reduce((acc, [lat, cyr]) => {
  acc[cyr] = lat;
  return acc;
}, {} as Record<string, string>);

export function transliterate(text: string, to: "uz_lat" | "uz_cyr"): string {
  if (!text) return text;
  
  if (to === "uz_cyr") {
    let res = text;
    // Replace multi-char first
    const multiChars = ["sh", "ch", "o'", "g'", "ya", "yu", "yo", "ts", "Sh", "Ch", "O'", "G'", "Ya", "Yu", "Yo", "Ts"];
    for (const mc of multiChars) {
      res = res.split(mc).join(latToCyrMap[mc]);
    }
    // Replace single chars
    return res.split('').map(c => latToCyrMap[c] || c).join('');
  } else if (to === "uz_lat") {
    return text.split('').map(c => cyrToLatMap[c] || c).join('');
  }
  
  return text;
}
