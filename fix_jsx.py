import sys

with open(r'C:\Users\atthort-win\Documents\sagradoCorazon4\frontend\src\App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix malformed template literal in compact (teaser) card
wrong1 = "className={`news-post news-post--teaser ${interactive ? 'news-post--clickable' : ''`}`}"
right1 = "className={`news-post news-post--teaser ${interactive ? 'news-post--clickable' : ''}`}"

# Fix malformed template literal in full card
wrong2 = "className={`news-post ${interactive ? 'news-post--clickable' : ''`}`}"
right2 = "className={`news-post ${interactive ? 'news-post--clickable' : ''}`}"

# Also fix HTML entities that were written literally in JSX text
wrong3 = "Leer m&#225;s"
right3 = "Leer m\u00e1s"

wrong4 = "|| 'Redacci&#243;n'"
right4 = "|| 'Redacci\u00f3n'"

wrong5 = ">&#8226; {"
right5 = ">\u2022 {"

count1 = content.count(wrong1)
count2 = content.count(wrong2)
count3 = content.count(wrong3)
count4 = content.count(wrong4)
count5 = content.count(wrong5)
print(f"wrong1 count: {count1}")
print(f"wrong2 count: {count2}")
print(f"wrong3 count: {count3}")
print(f"wrong4 count: {count4}")
print(f"wrong5 count: {count5}")

content = content.replace(wrong1, right1)
content = content.replace(wrong2, right2)
content = content.replace(wrong3, right3)
content = content.replace(wrong4, right4)
content = content.replace(wrong5, right5)

with open(r'C:\Users\atthort-win\Documents\sagradoCorazon4\frontend\src\App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done!")

