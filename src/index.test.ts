import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";
import { each } from "https://deno.land/x/gamla@91.0.0/src/index.ts";
import type { Func } from "https://deno.land/x/gamla@91.0.0/src/typing.ts";
import {
  approximateSemanticEquality,
  capitalizedPrefix,
  capitalizedSuffix,
  cleanSpeakers,
  matchesRegexp,
  ngramsOfAtLeastNWords,
  prefixesWithSuffix,
  quotedTexts,
  regexpEntireString,
  regexpTimes,
  simplify,
  someKewyordMatches,
  suffixesWithPrefix,
  telegramHandlesInText,
  urlsInText,
  wholeWord,
} from "./index.ts";

const testFn = <F extends Func>(name: string, f: F) =>
  each(([args, result]: [Parameters<F>, ReturnType<F>]) =>
    Deno.test(`${name}: ${JSON.stringify(args).substring(0, 10)}`, () =>
      assertEquals(f(...args), result))
  );

const testUnaryFn =
  <F extends Func>(name: string, f: F) =>
  (cases: [Parameters<F>[0], ReturnType<F>][]) =>
    testFn(name, f)(cases.map(([x, y]) => [[x] as Parameters<F>, y]));

testUnaryFn("hebrew kw matching", someKewyordMatches(["בדסמ"]))([
  ["חוזרים ליסודות בהרצאת “מבוא לבדסמ” במענטש, ב-15/01/24", true],
  ["בדסמ+", true],
  ["בדסמ🔥", true],
]);

testUnaryFn("plurality", someKewyordMatches(["talk"]))([["talks", true], [
  "talk",
  true,
]]);

testUnaryFn("wholeword", (x) => (wholeWord(/נתי/)).test(x))([
  ["הבנתי", false],
  ["ונתי", true],
]);

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
  ]));

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
    "Anthony 'Tony' Soprano Sr. : You know where I was yesterday when you called? Dr Jennifer Melfi : I don't know. Anthony 'Tony' Soprano Sr. : I was outside a whorehouse, while a guy that works for me was inside beating the shit out of a guy that owes me money. Broke his arm. Put a bullet in his kneecap. Dr Jennifer Melfi : How'd that make you feel? Anthony 'Tony' Soprano Sr. : Wished it was me in there. Dr Jennifer Melfi : Giving the beating or taking it?",
    "You know where I was yesterday when you called? I don't know. I was outside a whorehouse, while a guy that works for me was inside beating the shit out of a guy that owes me money. Broke his arm. Put a bullet in his kneecap. How'd that make you feel? Wished it was me in there. Giving the beating or taking it?",
  ],
  [
    "Neil Clarke : I can do ANYTHING! Okay... bu... but... what do I *really* want?  Neil Clarke : GIVE ME A REALLY BIG DICK!  Neil Clarke : Augh! ouch! NOT *THAT* BIG! Obviously! Dick, return to your old size!  Neil Clarke : Agh! Ah... Ok. Um... Let me have a penis that women find exciting!  Neil Clarke : Yeah, it's good, yeah. Could I have it white?",
    "I can do ANYTHING! Okay... bu... but... what do I *really* want? GIVE ME A REALLY BIG DICK! Augh! ouch! NOT *THAT* BIG! Obviously! Dick, return to your old size! Agh! Ah... Ok. Um... Let me have a penis that women find exciting! Yeah, it's good, yeah. Could I have it white?",
  ],
  [
    "Roy 'Tin Cup' McAvoy : Sex and golf are the two things you don't have to be good at to enjoy",
    "Sex and golf are the two things you don't have to be good at to enjoy",
  ],
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

testUnaryFn("simplify", simplify)([
  ["M*A*S*H", "mash"],
  ["Israël", "israel"],
  ["MASSIMO 🇫🇷", "massimo"],
]);

testUnaryFn(
  "times",
  matchesRegexp(regexpEntireString(regexpTimes(1, 3, /a/))),
)([
  ["aa", true],
  ["aaaa", false],
]);

testUnaryFn("urlsInText", urlsInText)([
  [
    `Micro production
hahev11@walla.com


מקום

ישראל
תגיות`,
    [],
  ],
  [
    ` 
  מתלבט.ת? בוא.י נדבר
  להרשמה
  IMG_6773.jpg
  שמחה שבחרת להצטרף אלינו :)
  מיד אחרי ההרשמה יפתח עבורך דף תשלום
  שם מלא
  טלפון
  מייל another-image.jpg`,
    [],
  ],
  [
    `🌵מקומות אחרונים לריטריט בשישי הקרוב!! ריטריט יום ADAMA- חזרה לשלווה הפנימית, היטענות בכוחות ומשאבים עם שירי לבני 🌼

הזדמנות אחרונה להצטרף לריטריט של יום אחד, שיאפשר לנו לחזור פנימה חזרה לסנטר שלנו, לשקט הפנימי שקצת הלך לאיבוד בתקופה הזאת. לקחת פסק זמן מהכל ופשוט לבחור רגע בעצמנו 

🌼 מדיטציה ודמיון מודרך 
🌼 תקשורת מקרבת 
🌼 כלים לוויסות מערכת העצבים 
🌼 הקשבה לגוף 
🌼זימון ובריאת מציאות 
🌼מגע מקרקע 
🌼 אנשים ממש ממש טובים 😍

סטודיו נעים, מרווח ובמיקום מדהים במרכז תל אביב, 
שלווה אורבנית 🌬️

* הריטריט מתאים לכל גיל, מתחילים ומנוסים כאחד 

יום שישי הקרוב 3.5// 11:00-17:00 // בית להיוולד מחדש, תל אביב
 
לעמוד הנחיתה עם כל הפרטים >> Shiri-livny.com/adamaretreat


✧✧✧✧✧

רוצה לדעת לפני כולם מה קורה?
להצטרפות לקבוצות של מה קורה היום? >> makorehayom.info/48YR0Sw`,
    ["Shiri-livny.com/adamaretreat", "makorehayom.info/48YR0Sw"],
  ],
  ["מחר ה-3.7 ב-21:00 בתל אביב", []],
  ["", []],
  [
    "https://gigtickets.co.il/il//eid/101",
    ["https://gigtickets.co.il/il//eid/101"],
  ],
]);

testUnaryFn("telegram handlers", telegramHandlesInText)([
  ["", []],
  ["john@gmail.com", []],
  ["my telegram handle is @jonny", ["jonny"]],
]);
