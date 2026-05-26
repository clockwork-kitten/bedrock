const results = await Promise.race([fetchA(), fetchB()]);
