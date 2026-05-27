function greet(name: string): string {
  if (name === undefined) {
    name = "world";
  }

  return "hello " + name;
}
