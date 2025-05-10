import {
  alljuxt,
  coerce,
  complement,
  includedIn,
  join,
  letIn,
  lowercase,
  map,
  max,
  nonempty,
  pipe,
  range,
  remove,
  replace,
  reverse,
  sort,
  split,
  take,
  trim,
  trimWhitespace,
} from "gamla";
import { fuzzySearch as fs } from "npm:levenshtein-search@0.1.2";
import phone from "npm:phone@3.1.59";
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
  // biome-ignore lint/suspicious/noAssignInExpressions: copied from chatgpt
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

export const paragraphToSentences: (s: string) => string[] = split(/\.\s/);

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

export const capitalizedPrefix: (s: string) => string = pipe(
  sentenceToWords,
  capitalizedSequence(preStopWords, []),
  wordsToSentence,
);

export const capitalizedSuffix: (s: string) => string = pipe(
  sentenceToWords,
  reverse<string>,
  capitalizedSequence([], preStopWords),
  reverse<string>,
  wordsToSentence,
);

export const prefixesWithSuffix = (pattern: RegExp, input: string): string[] =>
  regExpLocations(pattern, input).map(({ start }) => input.slice(0, start));

export const suffixesWithPrefix = (regex: RegExp, input: string): string[] =>
  regExpLocations(regex, input).map(({ end }) => input.slice(end));

export const majority =
  (equivalence: (str: string) => string) => (elements: string[]): string => {
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
    const values = pipe(Object.values<number>, sort<number>, take<number>(n))(
      counts,
    );
    return sort(
      Object.entries(counts)
        .filter(([, count]) => values.includes(count))
        .map(([x]) => x),
    );
  };

export const equivalence: (s: string) => string = pipe(
  lowercase,
  replace(/\bthe\b/i, ""),
  trim([" ", ".", ",", "-"]),
);

export const replaceSmartQuotes: (s: string) => string = pipe(
  replace(/…/g, "..."),
  replace(/[‘’]/g, "'"),
  replace(/[“”]/g, '"'),
);

const replaceDigitNames: (s: string) => string = pipe(
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

export const removeDiacritics = (x: string): string =>
  // biome-ignore lint/suspicious/noMisleadingCharacterClass: seems to work i'm not sure
  x.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const allEmojis =
  /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/;

const addFlag = (flag: string) => ({ source, flags }: RegExp) =>
  new RegExp(
    source,
    flags.includes(flag) ? flags : (flags + flag).split("").sort().join(""),
  );

export const globalize: (re: RegExp) => RegExp = addFlag("g");

export const simplify: (x: string) => string = pipe(
  (x: string) => x.trim(),
  replaceSmartQuotes,
  lowercase,
  replaceDigitNames,
  replace(/\[.*\]/, ""),
  replace(/[*:'"♪]/g, ""),
  replace(/[,.!?\n\-+]/g, " "),
  replace(/<\/?i>/g, ""),
  replace(/\bdoctor\b/g, "dr"),
  removeDiacritics,
  replace(globalize(allEmojis), " "),
  replace(/\s+/g, " "),
  (x: string) => x.trim(),
);

const allEnglishWordsAsSet = new Set(englishWords);

const fixMissingSpaceInOneWord = (x: string) =>
  allEnglishWordsAsSet.has(x) ? x : letIn(
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

const removeNonSemanticDifferences: (s: string) => string = pipe(
  lowercase,
  missingSpace,
  simplify,
  replace(/\bthe\b\s*/g, ""),
);

export const approximateSemanticEquality = (x: string, y: string): boolean =>
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

export const isStopWord: (word: string) => boolean = pipe(
  simplify,
  includedIn(stopWords),
);

export const quotedTexts = (input: string): string[] => {
  const regex = /"([^"]*)"/g;
  const matches = input.match(regex);
  return matches ? matches.map((match) => match.slice(1, -1)) : [];
};

export const concatRegexp = (x: RegExp, y: RegExp): RegExp =>
  new RegExp(x.source + y.source, combineFlags(x, y));

export const regexpEntireString = ({ source, flags }: RegExp): RegExp =>
  new RegExp(`^${source}$`, flags);

const combineFlags = (x: RegExp, y: RegExp) =>
  (x.flags + y.flags)
    .split("")
    .sort()
    .join("")
    .replace(/(.)(?=.*\1)/g, "");

export const stringToRegexp = (x: string): RegExp =>
  new RegExp(x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

export const caseInsensitive: (re: RegExp) => RegExp = addFlag("i");

export const regExpOr = (x: RegExp, y: RegExp): RegExp =>
  new RegExp(
    `(?:${bracketIfNeeded(x.source)}|${bracketIfNeeded(y.source)})`,
    combineFlags(x, y),
  );

export const selectionGroup = ({ source, flags }: RegExp): RegExp =>
  new RegExp(`(${source})`, flags);

const bracketIfNeeded = (s: string): string =>
  (s.startsWith("(") && s.endsWith(")")) ||
    (s.startsWith("[") && s.endsWith("]"))
    ? s
    : `(?:${s})`;

export const optional = ({ source, flags }: RegExp): RegExp =>
  new RegExp(`${bracketIfNeeded(source)}?`, flags);

export const zeroOrMore = ({ source, flags }: RegExp): RegExp =>
  new RegExp(`${bracketIfNeeded(source)}*`, flags);

export const oneOrMore = ({ source, flags }: RegExp): RegExp =>
  new RegExp(`${bracketIfNeeded(source)}+`, flags);

export const regexpTimes = (
  min: number,
  max: number,
  { source, flags }: RegExp,
): RegExp => new RegExp(`${bracketIfNeeded(source)}{${min},${max}}`, flags);

const namePrefix = ["ms", "mrs", "mr", "dr", "prof"]
  .map((x) => new RegExp(`${x}\\.?`))
  .map(caseInsensitive)
  .reduce(regExpOr);

const nameSuffix = ["sr", "jr"]
  .map((x) => new RegExp(`${x}\\.?`))
  .map(caseInsensitive)
  .reduce(regExpOr);

const personName = [
  optional(concatRegexp(namePrefix, /\s/)),
  regexpTimes(0, 4, /'?[A-Z][\w-]*\.?'?\s/),
  regExpOr(/[\w-]+/, concatRegexp(nameSuffix, /\s/)),
].reduce(concatRegexp);

const hyphen = /[―-]/;

const plurality = /s|ים|ות/i;

export const negativeLookBehind = ({ source, flags }: RegExp): RegExp =>
  new RegExp(`(?<!${source})`, flags);

const hebrewPrepositionalLetters = "הולב".split("").map((prefix) =>
  [
    negativeLookBehind(/[א-תa-zA-Z]/),
    stringToRegexp(prefix),
  ].reduce(concatRegexp)
).reduce(regExpOr);

// \b doesn't work for non ascii
const boundry: RegExp = [
  /[_@.-\s:/[\]?&%$#=*,!()]/,
  /^/,
  /$/,
  hebrewPrepositionalLetters,
  allEmojis,
  plurality,
].reduce(regExpOr);

const speaker = [optional(hyphen), personName, /\s?:/, boundry].reduce(
  concatRegexp,
);

const speakerInEnd = [hyphen, /\s*/, personName, /$/].reduce(concatRegexp);

const splitSentences = split(/(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=[,!.?:])\s/);

export const matchesRegexp = (r: RegExp) => (txt: string): boolean =>
  r.test(txt);

export const cleanSpeakers: (s: string) => string = pipe(
  splitSentences,
  remove(pipe(trimWhitespace, matchesRegexp(regexpEntireString(speaker)))),
  join(" "),
  replace(/\s+/g, " "),
  replace(speakerInEnd, ""),
  trimWhitespace,
);

export const ngramsOfAtLeastNWords = (n: number) => (s: string): string[] => {
  const words = s.split(" ");
  const ngrams: string[] = [];
  for (let i = 0; i <= words.length - n; i++) {
    for (let j = i + n; j <= words.length; j++) {
      ngrams.push(words.slice(i, j).join(" "));
    }
  }
  return ngrams;
};

export const wholeWord = ({ source, flags }: RegExp): RegExp =>
  new RegExp(`(^|${boundry.source})${source}($|${boundry.source})`, flags);

const containsPhrase = (str: string) => (re: RegExp) => re.test(str);
const strToRegexp = (s: string) => new RegExp(s);

const kwInText = (x: string) =>
  pipe(simplify, strToRegexp, wholeWord, containsPhrase(simplify(x)));

export const someKewyordMatches =
  (keywords: string[]) => (x: string): boolean => keywords.some(kwInText(x));

const removeEmails: (x: string) => string = replace(
  /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g,
  "",
);

const extractUrls = (text: string) => {
  const urlRegex =
    /\b(?:https?:\/\/|ftp:\/\/)?[\w.-]+\.[a-z]{2,}(?:\/[\w\-._~:/?#[\]@!$&'()*+,;=%]*)?\b/gi;
  return text.match(urlRegex) || [];
};

export const urlsInText: (text: string) => [] | RegExpMatchArray = (
  x: string,
) => extractUrls(removeEmails(x).replace(/\b[^\s]+.(jpg|png|jpeg)\b/g, ""));

type Keywords = { keywords: string[]; antiKeywords?: string[] };

type ValueToKeywords<T extends number | string | symbol> = Record<
  T,
  Keywords
>;

type PredicateAndValue<T> = [(txt: string) => boolean, T];

const keywordMatchers = <T extends number | string | symbol>(
  valuesAndKeywords: ValueToKeywords<T>,
) =>
  (Object.entries(valuesAndKeywords) as [T, Keywords][]).map(
    (
      [value, { keywords, antiKeywords }]: [T, Keywords],
    ): PredicateAndValue<T> => [
      alljuxt(
        someKewyordMatches(keywords),
        complement(someKewyordMatches(antiKeywords ?? [])),
      ),
      value,
    ],
  );
export const triggerByText: <T extends number | string | symbol>(
  x: ValueToKeywords<T>,
) => (text: string) => T[] = <T extends number | string | symbol>(
  x: ValueToKeywords<T>,
) =>
  pipe(
    keywordMatchers<T>,
    (matcher: PredicateAndValue<T>[]): (text: string) => T[] =>
      // @ts-expect-error pipe typing doesn't handle generics
      pipe(
        (text) => matcher.filter(([predicate]) => predicate(text)),
        map(([, value]) => value),
      ),
  )(x);

export const telegramHandlesInText = (x: string): string[] =>
  letIn(
    regExpOr(
      /.*\B@((?=\w{5,32}\b)[a-zA-Z0-9]+(?:_[a-zA-Z0-9]+)*).*/,
      /t.me\/(\w{4,})/,
    ).exec(x),
    (match) => match?.[1] ? [match[1]] : [],
  );

export const phonesInText = (country: string) => (x: string): string[] =>
  x.split("\n").map((y) => phone.phone(y, { country })).filter(({ isValid }) =>
    isValid
  ).map(({ phoneNumber }) => phoneNumber).map((x) =>
    coerce(x).replace("+", "")
  );
