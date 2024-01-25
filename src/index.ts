import {
  includedIn,
  join,
  letIn,
  lowercase,
  max,
  nonempty,
  pipe,
  range,
  replace,
  reverse,
  sort,
  split,
  take,
  trim,
  trimWhitespace,
} from "https://deno.land/x/gamla@43.0.0/src/index.ts";

import { remove } from "https://deno.land/x/gamla@43.0.0/src/filter.ts";
import { fuzzySearch as fs } from "npm:levenshtein-search";
import { englishWords } from "./englishWords.ts";
import { stopWords } from "./stopWords.ts";
export type FuzzyMatch = { start: number; end: number };

export const fuzzySearch = (
  query: string,
  text: string,
  threshold: number,
): FuzzyMatch[] => [...fs(query, text, threshold)];

type RegExpMatch = { start: number; end: number };

const regExpLocations = (pattern: RegExp, input: string): RegExpMatch[] => {
  const locations: RegExpMatch[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(input)) !== null) {
    locations.push({
      start: match.index,
      end: match.index + match[0].length,
    });
  }
  return locations;
};

const sentenceToWords = split(/\s+/);
const wordsToSentence = join(" ");

export const paragraphToSentences = split(/\.\s/);

const preStopWords = ["the", "with", "of", "and", "in"];

const capitalizedSequence =
  (stopWordsLeft: string[], stopWordsRight: string[]) =>
  (words: string[]): string[] => {
    const sequence = [];
    for (const word of words) {
      if (
        (!word.includes('"') &&
          sequence.length &&
          [...stopWordsLeft, ...stopWordsRight].includes(word)) ||
        (/[\dA-Z]/.test(word[0]) && !word.endsWith("'s"))
      ) {
        sequence.push(word);
      } else {
        break;
      }
    }
    let start = 0;
    while (start < sequence.length) {
      if (!stopWordsRight.includes(simplify(sequence[start]))) break;
      start++;
    }
    let end = sequence.length;
    while (end > start) {
      if (!stopWordsLeft.includes(simplify(sequence[end - 1]))) break;
      end--;
    }
    return sequence.slice(start, end);
  };

export const capitalizedPrefix = pipe(
  sentenceToWords,
  capitalizedSequence(preStopWords, []),
  wordsToSentence,
);

export const capitalizedSuffix = pipe(
  sentenceToWords,
  reverse<string>,
  capitalizedSequence([], preStopWords),
  reverse<string>,
  wordsToSentence,
);

export const prefixesWithSuffix = (pattern: RegExp, input: string) =>
  regExpLocations(pattern, input).map(({ start }) => input.slice(0, start));

export const suffixesWithPrefix = (regex: RegExp, input: string) =>
  regExpLocations(regex, input).map(({ end }) => input.slice(end));

export const majority =
  (equivalence: (str: string) => string) =>
  (elements: string[]): string => {
    const counts: Record<string, number> = {};
    const original: Record<string, string> = {};
    for (const element of elements) {
      const key = equivalence(element);
      original[key] = element;
      counts[key] = (counts[key] || 0) + 1;
    }
    return max(([, count]: [string, number]) => count)(
      Object.entries(counts),
    )[0];
  };

export const appearMoreThan =
  (n: number, equivalence: (str: string) => string) =>
  (elements: string[]): string[] => {
    const counts: Record<string, number> = {};
    const original: Record<string, string> = {};
    for (const element of elements) {
      const key = equivalence(element);
      original[key] = element;
      counts[key] = (counts[key] || 0) + 1;
    }
    return sort(
      Object.entries(counts)
        .filter(([, count]) => count > n)
        .map(([x]) => x),
    );
  };

export const topByCount =
  (n: number, equivalence: (str: string) => string) =>
  (elements: string[]): string[] => {
    const counts: Record<string, number> = {};
    const original: Record<string, string> = {};
    for (const element of elements) {
      const key = equivalence(element);
      original[key] = element;
      counts[key] = (counts[key] || 0) + 1;
    }
    const values = pipe(Object.values, sort, take(n))(counts);
    return sort(
      Object.entries(counts)
        .filter(([, count]) => values.includes(count))
        .map(([x]) => x),
    );
  };

export const equivalence = pipe(
  lowercase,
  replace(/\bthe\b/i, ""),
  trim([" ", ".", ",", "-"]),
);

export const replaceSmartQuotes = pipe(
  replace(/…/g, "..."),
  replace(/[‘’]/g, "'"),
  replace(/[“”]/g, '"'),
);

const replaceDidgitNames = pipe(
  replace(/\bten\b/g, "10"),
  replace(/\bnine\b/g, "9"),
  replace(/\beight\b/g, "8"),
  replace(/\bseven\b/g, "7"),
  replace(/\bsix\b/g, "6"),
  replace(/\bfive\b/g, "5"),
  replace(/\bfour\b/g, "4"),
  replace(/\bthree\b/g, "3"),
  replace(/\btwo\b/g, "2"),
  replace(/\bone\b/g, "1"),
  replace(/\bzero\b/g, "0"),
);

export const simplify: (x: string) => string = pipe(
  (x: string) => x.trim(),
  replaceSmartQuotes,
  lowercase,
  replace(/\s/g, " "),
  replaceDidgitNames,
  replace(/\[.*\]/, ""),
  replace(/[*:'"♪]/g, ""),
  replace(/[,.?!\n-]/g, " "),
  replace(/\s+/g, " "),
  replace(/<\/?i>/g, ""),
  replace(/\bdoctor\b/g, "dr"),
  (x: string) => x.trim(),
);

const allEnglishWordsAsSet = new Set(englishWords);

const fixMissingSpaceInOneWord = (x: string) =>
  allEnglishWordsAsSet.has(x)
    ? x
    : letIn(
        range(1, x.length - 1).find(
          (index) =>
            allEnglishWordsAsSet.has(x.slice(0, index)) &&
            allEnglishWordsAsSet.has(x.slice(index)),
        ),
        (location) =>
          location ? [x.slice(0, location), x.slice(location)].join(" ") : x,
      );

const missingSpace = (x: string) =>
  x.split(/\s/).map(fixMissingSpaceInOneWord).join(" ");

const removeNonSemanticDifferences = pipe(
  lowercase,
  missingSpace,
  simplify,
  replace(/\bthe\b\s*/g, ""),
);

export const approximateSemanticEquality = (x: string, y: string) =>
  letIn(
    {
      xSimple: removeNonSemanticDifferences(x),
      ySimple: removeNonSemanticDifferences(y),
    },
    ({ xSimple, ySimple }) =>
      nonempty(
        fuzzySearch(
          x.length > y.length ? xSimple : ySimple,
          x.length < y.length ? xSimple : ySimple,
          Math.round(0.2 * (x.length < y.length ? xSimple : ySimple).length),
        ),
      ),
  );

export const isStopWord = pipe(simplify, includedIn(stopWords));

export const quotedTexts = (input: string): string[] => {
  const regex = /"([^"]*)"/g;
  const matches = input.match(regex);
  return matches ? matches.map((match) => match.slice(1, -1)) : [];
};

export const concatRegexp = (x: RegExp, y: RegExp) =>
  new RegExp(x.source + y.source, combineFlags(x, y));

export const regexpEntireString = (x: RegExp) =>
  new RegExp(`^${x.source}$`, x.flags);

const combineFlags = (x: RegExp, y: RegExp) =>
  (x.flags + y.flags)
    .split("")
    .sort()
    .join("")
    .replace(/(.)(?=.*\1)/g, "");
const addFlag = (flag: string) => (x: RegExp) =>
  new RegExp(
    x.source,
    x.flags.includes(flag)
      ? x.flags
      : (x.flags + flag).split("").sort().join(""),
  );

export const stringToRegexp = (x: string) =>
  new RegExp(x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

export const caseInsensitive = addFlag("i");

export const regExpOr = (x: RegExp, y: RegExp) =>
  new RegExp(
    `(?:${bracketIfNeeded(x.source)}|${bracketIfNeeded(y.source)})`,
    combineFlags(x, y),
  );

export const selectionGroup = (x: RegExp) =>
  new RegExp(`(${x.source})`, x.flags);

const bracketIfNeeded = (s: string) =>
  (s.startsWith("(") && s.endsWith(")")) ||
  (s.startsWith("[") && s.endsWith("]"))
    ? s
    : `(?:${s})`;

const optional = (x: RegExp) =>
  new RegExp(`${bracketIfNeeded(x.source)}?`, x.flags);

export const zeroOrMore = (x: RegExp) =>
  new RegExp(`${bracketIfNeeded(x.source)}*`, x.flags);

export const oneOrMore = (x: RegExp) =>
  new RegExp(`${bracketIfNeeded(x.source)}+`, x.flags);

export const globalize = addFlag("g");

export const regexpTimes = (min: number, max: number, x: RegExp) =>
  new RegExp(`${bracketIfNeeded(x.source)}{${min},${max}}`, x.flags);

const speakerTitle = [/ms\./, /mrs\./, /mr\./, /dr\./]
  .map(caseInsensitive)
  .reduce(regExpOr);

const personName = [
  optional(concatRegexp(speakerTitle, /\s/)),
  regexpTimes(0, 2, /'?[A-Z][\w-]*\.?'?\s/),
  /[\w-]+/,
].reduce(concatRegexp);

const hyphen = /[―-]/;

const boundry = [/[@.-\s:/בלה[\]?&%$#=*,!()]/, /^/, /$/].reduce(regExpOr); // \b doesn't work for non ascii

const speaker = [optional(hyphen), personName, /\s?:/, boundry].reduce(
  concatRegexp,
);

const speakerInEnd = [hyphen, /\s*/, personName, /$/].reduce(concatRegexp);

export const negativeLookBehind = (x: RegExp) =>
  new RegExp(`(?<!${x.source})`, x.flags);

const splitSentences = split(/(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=[,.?:])\s/);

export const matchesRegexp = (r: RegExp) => (txt: string) => r.test(txt);

export const cleanSpeakers = pipe(
  splitSentences,
  remove(pipe(trimWhitespace, matchesRegexp(regexpEntireString(speaker)))),
  join(" "),
  replace(/\s+/g, " "),
  replace(speakerInEnd, ""),
  trimWhitespace,
);

export const ngramsOfAtLeastNWords = (n: number) => (s: string) => {
  const words = s.split(" ");
  const ngrams: string[] = [];
  for (let i = 0; i <= words.length - n; i++) {
    for (let j = i + n; j <= words.length; j++) {
      ngrams.push(words.slice(i, j).join(" "));
    }
  }
  return ngrams;
};

export const wholeWord = (r: RegExp) =>
  new RegExp(`(^|${boundry.source})${r.source}($|${boundry.source})`, r.flags);

const containsPhrase = (str: string) => (re: RegExp) => re.test(str);
const strToRegexp = (s: string) => new RegExp(s);

const kwInText = (x: string) =>
  pipe(simplify, strToRegexp, wholeWord, containsPhrase(simplify(x)));

export const someKewyordMatches = (keywords: string[]) => (x: string) =>
  keywords.some(kwInText(x));

export const urlsInText = (text: string) =>
  text.match(/https?:\/\/[^\s/$.?#].[^\s]*/g) || [];
