async function loadData(): Promise<void> {
  try {
    const response = await fetch("/api/data");
    const data = await response.json();
    console.log(data);
  } catch (error: unknown) {
    console.error(error);
  } finally {
    console.log("done");
  }
}
