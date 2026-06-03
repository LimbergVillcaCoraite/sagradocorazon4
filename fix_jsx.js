const fs = require('fs');

const file = 'C:\\Users\\atthort-win\\Documents\\sagradoCorazon4\\frontend\\src\\App.jsx';
let content = fs.readFileSync(file, 'utf8');

// Fix malformed template literal in compact (teaser) card className
const wrong1 = "className={`news-post news-post--teaser ${interactive ? 'news-post--clickable' : ''`}`}";
const right1 = "className={`news-post news-post--teaser ${interactive ? 'news-post--clickable' : ''}`}";

// Fix malformed template literal in full card className
const wrong2 = "className={`news-post ${interactive ? 'news-post--clickable' : ''`}`}";
const right2 = "className={`news-post ${interactive ? 'news-post--clickable' : ''}`}";

// Fix HTML entities
const wrong3 = "Leer m\u0026#225;s";
const right3 = "Leer m\u00e1s";

const wrong4a = "|| 'Redacci\u0026#243;n'";
const right4a = "|| 'Redacci\u00f3n'";

const wrong5 = ">\u0026#8226; {";
const right5 = ">\u2022 {";

console.log('wrong1 count:', (content.match(new RegExp(wrong1.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length);
console.log('wrong2 count:', (content.match(new RegExp(wrong2.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length);
console.log('wrong3 count:', content.includes(wrong3));
console.log('wrong4a count:', content.includes(wrong4a));
console.log('wrong5 count:', content.includes(wrong5));

// Also check what's actually in the file for the template literal
const idx = content.indexOf('news-post--teaser');
if (idx >= 0) {
  console.log('Context around teaser:', JSON.stringify(content.substring(idx - 15, idx + 90)));
}

content = content.split(wrong1).join(right1);
content = content.split(wrong2).join(right2);
content = content.split(wrong3).join(right3);
content = content.split(wrong4a).join(right4a);
content = content.split(wrong5).join(right5);

fs.writeFileSync(file, content, 'utf8');
console.log('Done!');

