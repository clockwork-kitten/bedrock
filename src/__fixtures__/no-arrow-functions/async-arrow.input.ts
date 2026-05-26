const fetchData = async (url: string) => {
  const result = await fetch(url);
  return result;
};
