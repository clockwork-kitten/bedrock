const fetchData = async function fetchData(url: string) {
  const result = await fetch(url);
  return result;
};
