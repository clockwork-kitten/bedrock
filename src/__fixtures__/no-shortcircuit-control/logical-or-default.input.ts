function greet(name: string | null): string {
  const displayName = name || "stranger";
  return "Hello " + displayName;
}
