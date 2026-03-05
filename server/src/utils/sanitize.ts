/** Strip sensitive fields before sending user data to the client. */
export function sanitizeUser(user: {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  provider: string;
  createdAt: Date;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    provider: user.provider,
    createdAt: user.createdAt,
  };
}
