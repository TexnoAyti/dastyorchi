// Uzbek Latin to Cyrillic mappings and vice-versa
// Rules:
// 1. Digraphs first (sh, ch, yu, ya, yo, ts)
// 2. o', g' characters
// 3. Special handling for 'e' and 'ye'
// 4. Standard letter mapping

export function latinToCyrillic(text: string): string {
  if (!text) return "";
  
  let result = text;

  // Protect word-initial 'ye' or 'Ye'
  result = result.replace(/Ye/g, "Е").replace(/YE/g, "Е").replace(/ye/g, "е");

  // In Uzbek Latin, 'e' at the start of a word is written as 'E'/'e', but converted to 'Э'/'э' in Cyrillic.
  result = result.replace(/\bE/g, "Э").replace(/\be/g, "э");
  
  // Also treat cases like 'e' after a vowel or punctuation as 'э' (e.g. Sanoat, va e'tiqod)
  result = result.replace(/([aeiouAEIOU'])e/g, "$1э");
  result = result.replace(/([aeiouAEIOU'])E/g, "$1Э");

  // Digraphs
  result = result.replace(/Sh/g, "Ш").replace(/SH/g, "Ш").replace(/sh/g, "ш");
  result = result.replace(/Ch/g, "Ч").replace(/CH/g, "Ч").replace(/ch/g, "ч");
  result = result.replace(/Yu/g, "Ю").replace(/YU/g, "Ю").replace(/yu/g, "ю");
  result = result.replace(/Ya/g, "Я").replace(/YA/g, "Я").replace(/ya/g, "я");
  result = result.replace(/Yo/g, "Ё").replace(/YO/g, "Ё").replace(/yo/g, "ё");
  result = result.replace(/Ts/g, "Ц").replace(/TS/g, "Ц").replace(/ts/g, "ц");

  // O' and G' and their variants
  result = result.replace(/O['’‘`´]/g, "Ў").replace(/o['’‘`´]/g, "ў");
  result = result.replace(/G['’‘`´]/g, "Ғ").replace(/g['’‘`´]/g, "ғ");

  // Single letter mappings
  const latToCyrMap: { [key: string]: string } = {
    "A": "А", "a": "а",
    "B": "Б", "b": "б",
    "V": "В", "v": "в",
    "G": "Г", "g": "г",
    "D": "Д", "d": "д",
    "E": "Е", "e": "е", // Remaining 'e' inside words mapped to Cyrillic 'Е/е'
    "J": "Ж", "j": "ж",
    "Z": "З", "z": "з",
    "I": "И", "i": "и",
    "Y": "Й", "y": "й",
    "K": "К", "k": "к",
    "L": "Л", "l": "л",
    "M": "М", "m": "м",
    "N": "Н", "n": "н",
    "O": "О", "o": "о",
    "P": "П", "p": "п",
    "R": "Р", "r": "р",
    "S": "С", "s": "с",
    "T": "Т", "t": "т",
    "U": "У", "u": "у",
    "F": "Ф", "f": "ф",
    "X": "Х", "x": "х",
    "Q": "Қ", "q": "қ",
    "H": "Ҳ", "h": "ҳ",
    "C": "Ц", "c": "ц"
  };

  let finalStr = "";
  for (let i = 0; i < result.length; i++) {
    const char = result[i];
    if (latToCyrMap[char] !== undefined) {
      finalStr += latToCyrMap[char];
    } else if (char === "'" || char === "’" || char === "‘" || char === "`") {
      finalStr += "ъ";
    } else {
      finalStr += char;
    }
  }

  return finalStr;
}

export function cyrillicToLatin(text: string): string {
  if (!text) return "";

  let result = text;

  // Cyrillic 'Е' at start of word or after vowels is converted to 'Ye/ye'
  const vowels = "АаЕеЁёИиОоУуЭэЮюЯяЎўЫыЪъ";
  let parseResult = "";
  for (let i = 0; i < result.length; i++) {
    const char = result[i];
    if (char === "Е" || char === "е") {
      const prevChar = i > 0 ? result[i - 1] : "";
      const isStartOrVowel = prevChar === "" || vowels.includes(prevChar) || /\s|[.,/#!$%^&*;:{}=\-_`~()]/.test(prevChar);
      if (isStartOrVowel) {
        parseResult += char === "Е" ? "Ye" : "ye";
      } else {
        parseResult += char === "Е" ? "E" : "e";
      }
    } else {
      parseResult += char;
    }
  }
  result = parseResult;

  // Replace Cyrillic digraphs and special letters
  result = result.replace(/Ё/g, "Yo").replace(/ё/g, "yo");
  result = result.replace(/Ю/g, "Yu").replace(/ю/g, "yu");
  result = result.replace(/Я/g, "Ya").replace(/я/g, "ya");
  result = result.replace(/Ш/g, "Sh").replace(/ш/g, "sh");
  result = result.replace(/Ч/g, "Ch").replace(/ч/g, "ch");
  result = result.replace(/Ц/g, "Ts").replace(/ц/g, "ts");
  result = result.replace(/Ў/g, "O'").replace(/ў/g, "o'");
  result = result.replace(/Ғ/g, "G'").replace(/ғ/g, "g'");
  result = result.replace(/Қ/g, "Q").replace(/қ/g, "q");
  result = result.replace(/Ҳ/g, "H").replace(/ҳ/g, "h");
  result = result.replace(/Х/g, "X").replace(/х/g, "x");
  result = result.replace(/Э/g, "E").replace(/э/g, "e");
  result = result.replace(/Ъ/g, "'").replace(/ъ/g, "'");

  // Standard 1-to-1 map
  const cyrToLatMap: { [key: string]: string } = {
    "А": "A", "а": "a",
    "Б": "B", "б": "b",
    "В": "V", "в": "v",
    "Г": "G", "г": "g",
    "Д": "D", "д": "d",
    "Ж": "J", "ж": "j",
    "З": "Z", "з": "z",
    "И": "I", "и": "i",
    "Й": "Y", "й": "y",
    "К": "K", "к": "k",
    "Л": "L", "л": "l",
    "М": "M", "м": "m",
    "Н": "N", "н": "n",
    "О": "O", "о": "o",
    "П": "P", "п": "p",
    "Р": "R", "р": "r",
    "С": "S", "с": "s",
    "Т": "T", "т": "t",
    "У": "U", "у": "u",
    "Ф": "F", "ф": "f"
  };

  let finalStr = "";
  for (let i = 0; i < result.length; i++) {
    const char = result[i];
    if (cyrToLatMap[char] !== undefined) {
      finalStr += cyrToLatMap[char];
    } else {
      finalStr += char;
    }
  }

  return finalStr;
}
