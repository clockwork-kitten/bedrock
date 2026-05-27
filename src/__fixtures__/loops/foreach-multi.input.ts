function processData(items: string[], counts: number[]): void {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    console.log(item.toUpperCase());
  }

  for (let i1 = 0; i1 < counts.length; i1++) {
    const count = counts[i1];
    console.log(String(count));
  }

  for (let i2 = 0; i2 < items.length; i2++) {
    const x = items[i2];
    const idx = i2;
    console.log(x + String(idx));
  }
}
