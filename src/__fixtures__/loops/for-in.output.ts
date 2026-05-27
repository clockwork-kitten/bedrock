const obj = { a: 1, b: 2 };
const keys = Object.keys(obj);

for (let i = 0; i < keys.length; i = i + 1) {
  const key = keys[i];
  console.log(key);
}
