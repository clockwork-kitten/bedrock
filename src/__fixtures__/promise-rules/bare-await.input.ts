async function fetchData(): Promise<string> {
  const response = await fetch("/api/data");
  const data = await response.json();
  return data;
}
