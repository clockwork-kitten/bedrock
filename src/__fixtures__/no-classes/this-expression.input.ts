function greet(this: { name: string }): string {
  return "Hello, " + this.name;
}
