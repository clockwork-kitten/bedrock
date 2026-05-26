type User = { address?: { city: string } };

function getCity(user: User): string | undefined {
  return user.address?.city;
}
