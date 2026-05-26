async function fetchData(): Promise<string> {
  try {
    const response = await fetch("/api/data");
    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
}
