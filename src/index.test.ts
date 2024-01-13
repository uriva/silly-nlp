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

type Func = (...args: any[]) => any;

const testFn =
  <F extends Func>(name: string, f: F) =>
  (cases: [Parameters<F>, ReturnType<F>][]) =>
    Deno.test(name, () =>
      cases.forEach(([args, result]) => assertEquals(f(...args), result)),
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
    `Ant-Man :  Oh, you're going to have to take this to the shop. Iron Man : Who's speaking? Ant-Man : It's your conscience. We don't talk a lot these days.`,
    `Oh, you're going to have to take this to the shop. Who's speaking? It's your conscience. We don't talk a lot these days.`,
  ],
  [
    "Han Solo :  Uh, everything's under control. Situation normal. Voice : What happened? Han Solo :  Uh, we had a slight weapons malfunction, but uh... everything's perfectly all right now. We're fine. We're all fine here now, thank you. How are you? Voice : We're sending a squad up. Han Solo : Uh, uh... negative, negative. We had a reactor leak here now. Give us a few minutes to lock it down. Large leak, very dangerous. Voice : Who is this? What's your operating number? Han Solo : Uh...  Han Solo :  Boring conversation anyway. LUKE, WE'RE GONNA HAVE COMPANY!",
    "Uh, everything's under control. Situation normal. What happened? Uh, we had a slight weapons malfunction, but uh... everything's perfectly all right now. We're fine. We're all fine here now, thank you. How are you? We're sending a squad up. Uh, uh... negative, negative. We had a reactor leak here now. Give us a few minutes to lock it down. Large leak, very dangerous. Who is this? What's your operating number? Uh... Boring conversation anyway. LUKE, WE'RE GONNA HAVE COMPANY!",
  ],
  [
    'Jake Sully: Neytiri calls me skxawng. It means "moron."',
    "Neytiri calls me skxawng. It means moron.",
  ],
  [
    '"Jesus! Did I SAY that? Or just think it? Was I talking? Did they hear me? I glanced over at my attorney, but he seemed oblivious…"― Hunter S. Thompson',
    "Jesus! Did I SAY that? Or just think it? Was I talking? Did they hear me? I glanced over at my attorney, but he seemed oblivious…",
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
