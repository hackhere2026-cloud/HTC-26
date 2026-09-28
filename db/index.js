export function database(env) {
  if (!env.DB) throw new Error('Registration database binding is unavailable');
  return env.DB;
}
