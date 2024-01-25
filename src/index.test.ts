import { sideLog } from "https://deno.land/x/gamla@43.0.0/src/debug.ts";
import { regexpTimes } from "./index.ts";
import { matchesRegexp } from "./index.ts";
import {
  approximateSemanticEquality,
  capitalizedPrefix,
  capitalizedSuffix,
  cleanSpeakers,
  ngramsOfAtLeastNWords,
  prefixesWithSuffix,
  quotedTexts,
  simplify,
  someKewyordMatches,
  suffixesWithPrefix,
} from "./index.ts";

import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";
import { regexpEntireString } from "./index.ts";

type Func = (...args: any[]) => any;

const testFn =
  <F extends Func>(name: string, f: F) =>
  (cases: [Parameters<F>, ReturnType<F>][]) =>
    cases.forEach(([args, result]) =>
      Deno.test(name, () => assertEquals(f(...args), result)),
    );

const testUnaryFn =
  <F extends Func>(name: string, f: F) =>
  (cases: [Parameters<F>[0], ReturnType<F>][]) =>
    testFn(name, f)(cases.map(([x, y]) => [[x] as Parameters<F>, y]));

testUnaryFn(
  "someKewyordMatches",
  someKewyordMatches(["בדסמ"]),
)([["חוזרים ליסודות בהרצאת “מבוא לבדסמ” במענטש, ב-15/01/24", true]]);

testFn(
  "prefixesWithSuffix",
  prefixesWithSuffix,
)([
  [[/\s+clip/gi, "hello"], []],
  [
    [
      /\s+clip/gi,
      "APOCALYPSE NOW Clip - Smell of Napalm in the Morning (1979) Robert Duvall JoBlo Movie Clips 5.77M subscribers Subscribe Subscribed 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 1...",
    ],
    [
      "APOCALYPSE NOW",
      "APOCALYPSE NOW Clip - Smell of Napalm in the Morning (1979) Robert Duvall JoBlo Movie",
    ],
  ],
  [
    [
      /\s+\(\d\d\d\d\)/gi,
      "Uncle Ben : Remember, with great power comes great responsibility (scene) - Spider-Man (2002) Movie CLIP [1080p HD]TM & © Sony (2002)Fair use.Copyright Discl...",
    ],
    [
      "Uncle Ben : Remember, with great power comes great responsibility (scene) - Spider-Man",
      "Uncle Ben : Remember, with great power comes great responsibility (scene) - Spider-Man (2002) Movie CLIP [1080p HD]TM & © Sony",
    ],
  ],
]);

Deno.test("suffixesWithPrefix", () =>
  assertEquals(suffixesWithPrefix(/from\s+/gi, "from the matrix"), [
    "the matrix",
  ]),
);

Deno.test("capitalizedSuffix", () => {
  assertEquals(
    capitalizedSuffix(
      "Uncle Ben : Remember, with great power comes great responsibility (scene) - Spider-Man",
    ),
    "Spider-Man",
  );
});
Deno.test("capitalizedPrefix", () => {
  assertEquals(
    capitalizedPrefix(
      "Jerry Maguire with a subscription on Peacock, rent on Amazon Prime Video, Vudu, Apple TV, or buy on Amazon Prime Video, Vudu, Apple TV.",
    ),
    "Jerry Maguire",
  );
});

Deno.test("quotedTexts", () => {
  assertEquals(
    quotedTexts(
      'the movie "the matrix" is pretty good i remember the quote "i know kung fu"',
    ),
    ["the matrix", "i know kung fu"],
  );
});

testFn(
  "approximateSemanticEquality",
  approximateSemanticEquality,
)([
  [["Snow White and theSeven Dwarfs", "Snow White and the Seven Dwarfs"], true],
  [
    [
      "The Lord of the Rings: The Fellowship of the Ring",
      "Lord of The Rings - Fellowship of The Ring",
    ],
    true,
  ],
  [["judge dred", "judge dredd"], true],
  [["judge dred", "Judgg Dredd"], true],
  [["a name with more words", "a name"], false],
  [["a name", "a name with more words"], false],
]);

testUnaryFn(
  "cleanSpeakers",
  cleanSpeakers,
)([
  [
    "Mr. Darcy: You must know... surely, you must know it was all for you. You are too generous to trifle with me. I believe you spoke with my aunt last night, and it has taught me to hope as I'd scarcely allowed myself before. If your feelings are still what they were last April, tell me so at once. My affections and wishes have not changed, but one word from you will silence me forever. If, however, your feelings have changed, I will have to tell you: you have bewitched me, body and soul, and I love--I love--I love you. I never wish to be parted from you from this day on.",
    "You must know... surely, you must know it was all for you. You are too generous to trifle with me. I believe you spoke with my aunt last night, and it has taught me to hope as I'd scarcely allowed myself before. If your feelings are still what they were last April, tell me so at once. My affections and wishes have not changed, but one word from you will silence me forever. If, however, your feelings have changed, I will have to tell you: you have bewitched me, body and soul, and I love--I love--I love you. I never wish to be parted from you from this day on.",
  ],
  [
    "Mr. Collins : Charlotte, come here. Charlotte Lucas : Has the pig escaped again?  Charlotte Lucas : Oh. It's Lady Catherine.",
    "Charlotte, come here. Has the pig escaped again? Oh. It's Lady Catherine.",
  ],
  [
    "Rachel : See? Unisex. Joey : Maybe *you* need sex. I just had it a few days ago. Rachel : No, Joey, U-N-I-sex. Joey : I wouldn't say no to that.",
    "See? Unisex. Maybe *you* need sex. I just had it a few days ago. No, Joey, U-N-I-sex. I wouldn't say no to that.",
  ],
  [
    `Ant-Man :  Oh, you're going to have to take this to the shop. Iron Man : Who's speaking? Ant-Man : It's your conscience. We don't talk a lot these days.`,
    `Oh, you're going to have to take this to the shop. Who's speaking? It's your conscience. We don't talk a lot these days.`,
  ],
  [
    "Han Solo :  Uh, everything's under control. Situation normal. Voice : What happened? Han Solo :  Uh, we had a slight weapons malfunction, but uh... everything's perfectly all right now. We're fine. We're all fine here now, thank you. How are you? Voice : We're sending a squad up. Han Solo : Uh, uh... negative, negative. We had a reactor leak here now. Give us a few minutes to lock it down. Large leak, very dangerous. Voice : Who is this? What's your operating number? Han Solo : Uh...  Han Solo :  Boring conversation anyway. LUKE, WE'RE GONNA HAVE COMPANY!",
    "Uh, everything's under control. Situation normal. What happened? Uh, we had a slight weapons malfunction, but uh... everything's perfectly all right now. We're fine. We're all fine here now, thank you. How are you? We're sending a squad up. Uh, uh... negative, negative. We had a reactor leak here now. Give us a few minutes to lock it down. Large leak, very dangerous. Who is this? What's your operating number? Uh... Boring conversation anyway. LUKE, WE'RE GONNA HAVE COMPANY!",
  ],
  [
    'Jake Sully: Neytiri calls me skxawng. It means "moron."',
    'Neytiri calls me skxawng. It means "moron."',
  ],
  [
    '"Jesus! Did I SAY that? Or just think it? Was I talking? Did they hear me? I glanced over at my attorney, but he seemed oblivious…"― Hunter S. Thompson',
    '"Jesus! Did I SAY that? Or just think it? Was I talking? Did they hear me? I glanced over at my attorney, but he seemed oblivious…"',
  ],
]);

testUnaryFn(
  "ngramsOfAtLeastNWords",
  ngramsOfAtLeastNWords(2),
)([
  [
    "hello this is dog",
    [
      "hello this",
      "hello this is",
      "hello this is dog",
      "this is",
      "this is dog",
      "is dog",
    ],
  ],
]);

testUnaryFn("simplify", simplify)([["M*A*S*H", "mash"]]);

testUnaryFn(
  "times",
  matchesRegexp(regexpEntireString(regexpTimes(1, 3, /a/))),
)([
  ["aa", true],
  ["aaaa", false],
]);
