export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Falta la variable de entorno ${name}. Configúrala antes de iniciar el servidor.`);
  }
  return value;
}
