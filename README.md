# silly-nlp

A quirky, practical, and highly robust collection of Natural Language Processing
(NLP) and Regular Expression (RegExp) helper utilities for Deno.

Designed for real-world text processing tasks like screenplay/transcript
cleaning, semantic grouping, multilingual whole-word boundaries, entity
extraction, and functional RegExp building.

---

## Installation

This package is designed to be used with **Deno**. You can import it directly
from JSR:

```typescript
import { ... } from "jsr:@uri/silly-nlp";
```

Alternatively, if you are developing or testing locally, import `src/index.ts`
directly:

```typescript
import { ... } from "./src/index.ts";
```

---

## Table of Contents

- [Text Normalization & Simplification](#text-normalization--simplification)
- [Semantic Comparison & Equality](#semantic-comparison--equality)
- [Feature Extraction (URLs, Phone Numbers, Telegram, Quotes)](#feature-extraction)
- [Dialogue & Screenplay Processing](#dialogue--screenplay-processing)
- [Aggregation & Text Mining Utilities](#aggregation--text-mining-utilities)
- [Functional RegExp Builders & Combinators](#functional-regexp-builders--combinators)

---

## Text Normalization & Simplification

### `simplify`

Thoroughly cleans and normalizes text for robust comparisons.

- **Converts** to lowercase.
- **Replaces** smart quotes and ellipses with standard ASCII characters.
- **Replaces** written digit names (e.g., `"one"`, `"two"`, `"ten"`) with their
  numeric representation (e.g., `"1"`, `"2"`, `"10"`).
- **Removes** bracketed contents (`[...]`, `{...}`).
- **Removes** non-alphanumeric punctuation and HTML tags.
- **Removes** diacritics and accents (e.g., converting `Israël` to `israel`).
- **Collapses** emojis and consecutive whitespaces into a single space.
- **Trims** leading and trailing spaces.

```typescript
import { simplify } from "jsr:@uri/silly-nlp";

const clean = simplify("M*A*S*H, Israël, five cats!");
// "mash israel 5 cats"
```

### `equivalence`

A lightweight simplification step suitable for matching grouping keys. It
converts text to lowercase, removes the word `"the"` (respecting word
boundaries), and trims punctuation characters (spaces, dots, commas, and
hyphens).

```typescript
import { equivalence } from "jsr:@uri/silly-nlp";

const key = equivalence("The Matrix,");
// "matrix"
```

### `replaceSmartQuotes`

Replaces smart curly quotes (`’`, `‘`, `“`, `”`) and ellipses (`…`) with
standard ASCII equivalents.

```typescript
import { replaceSmartQuotes } from "jsr:@uri/silly-nlp";

const clean = replaceSmartQuotes("‘hello’ … “world”");
// "'hello' ... \"world\""
```

### `removeDiacritics`

Normalizes the string to Unicode Canonical Decomposition (NFD) and strips away
combining diacritical marks.

```typescript
import { removeDiacritics } from "jsr:@uri/silly-nlp";

const clean = removeDiacritics("Israël");
// "Israel"
```

---

## Semantic Comparison & Equality

### `approximateSemanticEquality`

Checks if two strings are semantically approximately equal by:

1. Cleaning and simplifying both strings.
2. Correcting common run-together English words (e.g., `"theSeven"` ->
   `"the Seven"`).
3. Stripping non-semantic differences (like the word `"the"`).
4. Running a fuzzy Levenshtein search between the two strings with an allowed
   edit distance of up to 20% of the target string's length.

```typescript
import { approximateSemanticEquality } from "jsr:@uri/silly-nlp";

const isEqual = approximateSemanticEquality(
  "The Lord of the Rings: The Fellowship of the Ring",
  "Lord of The Rings - Fellowship of The Ring",
);
// true

const isNearMatch = approximateSemanticEquality("judge dred", "judge dredd");
// true
```

### `isStopWord`

Checks if a given word (once simplified) is on the built-in stop words list.

```typescript
import { isStopWord } from "jsr:@uri/silly-nlp";

const isStop = isStopWord("the");
// true
```

---

## Feature Extraction

### `fuzzySearch`

Performs a fuzzy search utilizing Levenshtein distance. Returns start and end
character locations of any matches under the given threshold.

```typescript
import { fuzzySearch } from "jsr:@uri/silly-nlp";

const text = "A quick brown fox jumps over the lazy dog";
const matches = fuzzySearch("jumps", text, 1);
// [{ start: 18, end: 23 }]
```

### `urlsInText`

Extracts and returns valid HTTP, HTTPS, or domain-level URLs in the text while
automatically ignoring email addresses and common image extensions (like `.png`,
`.jpg`, `.jpeg`).

```typescript
import { urlsInText } from "jsr:@uri/silly-nlp";

const text = "לעמוד הנחיתה עם כל הפרטים >> Shiri-livny.com/adamaretreat";
const urls = urlsInText(text);
// ["Shiri-livny.com/adamaretreat"]
```

### `telegramHandlesInText`

Extracts Telegram user handles or Channel names from raw text, looking for both
`@username` and `t.me/username` formats.

```typescript
import { telegramHandlesInText } from "jsr:@uri/silly-nlp";

const handles = telegramHandlesInText(
  "My Telegram is @jonny or join t.me/my_channel",
);
// ["jonny"] (returns first matched handle)
```

### `phonesInText`

Extracts and normalizes valid phone numbers from multiline text, using the
specified default country code. Returns phone numbers in national/international
E.164 formats with the leading `+` removed.

```typescript
import { phonesInText } from "jsr:@uri/silly-nlp";

const extractPhones = phonesInText("IL");
const phones = extractPhones("054-1234567\nNot a phone: 12345");
// ["972541234567"]
```

### `quotedTexts`

Extracts all text enclosed in double quotes.

```typescript
import { quotedTexts } from "jsr:@uri/silly-nlp";

const quotes = quotedTexts(
  'The movie "The Matrix" has the quote "I know kung fu"',
);
// ["The Matrix", "I know kung fu"]
```

### `paragraphToSentences`

Splits a paragraph into an array of sentences using `.` (period followed by
whitespace) as the boundary.

```typescript
import { paragraphToSentences } from "jsr:@uri/silly-nlp";

const sentences = paragraphToSentences(
  "Hello world. This is silly-nlp. Enjoy.",
);
// ["Hello world", "This is silly-nlp", "Enjoy."]
```

---

## Dialogue & Screenplay Processing

### `cleanSpeakers`

Removes screenplay and transcript speaker headings (e.g.,
`Anthony 'Tony' Soprano Sr. :`, `Dr Jennifer Melfi :`, `Mr. Darcy:`, etc.),
leaving only the actual spoken text. It supports various titles (`Mr.`, `Mrs.`,
`Dr.`, `Prof.`, etc.) and multi-word names.

```typescript
import { cleanSpeakers } from "jsr:@uri/silly-nlp";

const rawDialogue =
  "Mr. Darcy: You must know... surely, you must know it was all for you.";
const cleaned = cleanSpeakers(rawDialogue);
// "You must know... surely, you must know it was all for you."
```

### `capitalizedPrefix`

Finds and extracts the longest leading title or capitalized proper noun phrase
from a string, skipping allowed stop words like `"the"`, `"with"`, `"of"`, etc.

```typescript
import { capitalizedPrefix } from "jsr:@uri/silly-nlp";

const heading = "Jerry Maguire with a subscription on Peacock...";
const prefix = capitalizedPrefix(heading);
// "Jerry Maguire"
```

### `capitalizedSuffix`

Finds and extracts the longest trailing capitalized proper noun phrase from a
string, reading backwards from the end.

```typescript
import { capitalizedSuffix } from "jsr:@uri/silly-nlp";

const heading =
  "Remember, with great power comes great responsibility - Spider-Man";
const suffix = capitalizedSuffix(heading);
// "Spider-Man"
```

### `prefixesWithSuffix`

Extracts all prefixes in a text that occur prior to matches of the provided
regular expression.

```typescript
import { prefixesWithSuffix } from "jsr:@uri/silly-nlp";

const results = prefixesWithSuffix(
  /\s+clip/gi,
  "APOCALYPSE NOW Clip - Smell of Napalm",
);
// ["APOCALYPSE NOW"]
```

### `suffixesWithPrefix`

Extracts all suffixes in a text that occur after matches of the provided regular
expression.

```typescript
import { suffixesWithPrefix } from "jsr:@uri/silly-nlp";

const results = suffixesWithPrefix(/from\s+/gi, "from the matrix");
// ["the matrix"]
```

---

## Aggregation & Text Mining Utilities

### `ngramsOfAtLeastNWords`

Generates all word-level n-grams from a string that have a length of at least
`n` words.

```typescript
import { ngramsOfAtLeastNWords } from "jsr:@uri/silly-nlp";

const ngrams = ngramsOfAtLeastNWords(2)("hello this is dog");
// [
//   "hello this",
//   "hello this is",
//   "hello this is dog",
//   "this is",
//   "this is dog",
//   "is dog"
// ]
```

### `someKewyordMatches`

Checks whether any keyword in a list is found as a whole-word, normalized match
within the text.

```typescript
import { someKewyordMatches } from "jsr:@uri/silly-nlp";

const matches = someKewyordMatches(["talk"])("Let's have some talks");
// true
```

### `triggerByText`

Builds an intent or keyword matching engine. Given a mapping from intent values
to positive and negative (anti) keywords, returns a function that outputs all
intent values triggered by a given text.

```typescript
import { triggerByText } from "jsr:@uri/silly-nlp";

const trigger = triggerByText({
  orderPizza: {
    keywords: ["pizza", "order"],
    antiKeywords: ["cancel", "no"],
  },
  greeting: {
    keywords: ["hello", "hi"],
  },
});

const intents = trigger("I'd like to order a pizza, hello!");
// ["orderPizza", "greeting"]
```

### `majority`

Groups an array of strings by their equivalent forms (determined by a custom
equivalence function) and returns the original string representing the most
common group.

```typescript
import { equivalence, majority } from "jsr:@uri/silly-nlp";

const movies = ["Matrix", "the matrix", "Inception", "The Matrix"];
const winner = majority(equivalence)(movies);
// "The Matrix" (or another representative of the most frequent equivalent group)
```

### `appearMoreThan`

Returns a sorted list of equivalent keys from an array of strings that appear
strictly more than `n` times.

```typescript
import { appearMoreThan, equivalence } from "jsr:@uri/silly-nlp";

const fruits = ["apple", "banana", "apple", "orange"];
const popular = appearMoreThan(1, equivalence)(fruits);
// ["apple"]
```

### `topByCount`

Returns sorted equivalent keys of elements whose frequencies of occurrence match
the top `n` most frequent group counts.

```typescript
import { equivalence, topByCount } from "jsr:@uri/silly-nlp";

const items = ["a", "a", "b", "c"];
const results = topByCount(1, equivalence)(items);
// ["a"]
```

---

## Functional RegExp Builders & Combinators

### `wholeWord`

Wraps a RegExp pattern so it only matches if surrounded by word boundaries or
specific boundary markers (including punctuation, Hebrew prepositions, plurality
endings, and emojis). Excellent for cross-language (non-ASCII) whole-word
matches.

```typescript
import { wholeWord } from "jsr:@uri/silly-nlp";

const pattern = wholeWord(/נתי/);
// Matches "ונתי" (with Hebrew preposition) but not "הבנתי" (no boundary inside root)
```

### `caseInsensitive`

Adds the case-insensitive (`i`) flag to a RegExp.

```typescript
import { caseInsensitive } from "jsr:@uri/silly-nlp";

const regex = caseInsensitive(/hello/);
// /hello/i
```

### `globalize`

Adds the global (`g`) flag to a RegExp.

```typescript
import { globalize } from "jsr:@uri/silly-nlp";

const regex = globalize(/hello/);
// /hello/g
```

### `concatRegexp`

Concatenates two regular expressions into a single RegExp while merging and
deduplicating their flags.

```typescript
import { concatRegexp } from "jsr:@uri/silly-nlp";

const regex = concatRegexp(/hello/i, /world/g);
// /helloworld/gi
```

### `regexpEntireString`

Forces a RegExp to match the entire string by wrapping it with `^` and `$`.

```typescript
import { regexpEntireString } from "jsr:@uri/silly-nlp";

const regex = regexpEntireString(/abc/i);
// /^abc$/i
```

### `stringToRegexp`

Escapes special RegExp characters in a literal string, returning a safe literal
matching RegExp.

```typescript
import { stringToRegexp } from "jsr:@uri/silly-nlp";

const regex = stringToRegexp("a.b*c");
// /a\.b\*c/
```

### `regExpOr`

Creates a non-capturing OR combination of two regular expressions: `(?:x|y)`.

```typescript
import { regExpOr } from "jsr:@uri/silly-nlp";

const regex = regExpOr(/abc/, /def/);
// /(?:abc|def)/
```

### `selectionGroup`

Wraps the RegExp inside a standard capturing group: `(pattern)`.

```typescript
import { selectionGroup } from "jsr:@uri/silly-nlp";

const regex = selectionGroup(/abc/);
// /(abc)/
```

### `optional`

Makes the pattern optional: `(?:pattern)?`.

```typescript
import { optional } from "jsr:@uri/silly-nlp";

const regex = optional(/abc/);
// /(?:abc)?/
```

### `zeroOrMore`

Matches the pattern zero or more times: `(?:pattern)*`.

```typescript
import { zeroOrMore } from "jsr:@uri/silly-nlp";

const regex = zeroOrMore(/abc/);
// /(?:abc)*/
```

### `oneOrMore`

Matches the pattern one or more times: `(?:pattern)+`.

```typescript
import { oneOrMore } from "jsr:@uri/silly-nlp";

const regex = oneOrMore(/abc/);
// /(?:abc)+/
```

### `regexpTimes`

Matches a pattern between `min` and `max` times: `(?:pattern){min,max}`.

```typescript
import { regexpTimes } from "jsr:@uri/silly-nlp";

const regex = regexpTimes(1, 3, /a/);
// /(?:a){1,3}/
```

### `negativeLookBehind`

Creates a negative lookbehind assertion around the pattern: `(?<!pattern)`.

```typescript
import { negativeLookBehind } from "jsr:@uri/silly-nlp";

const regex = negativeLookBehind(/abc/);
// /(?<!abc)/
```

### `matchesRegexp`

Higher-order helper that returns a curried predicate testing whether a string
matches the given RegExp.

```typescript
import { matchesRegexp } from "jsr:@uri/silly-nlp";

const isHello = matchesRegexp(/^hello$/i);
isHello("Hello"); // true
isHello("hi"); // false
```

---

## License

MIT
