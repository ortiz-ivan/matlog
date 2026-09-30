// Configuración leída de .env (ver .env.example). Falla al arrancar si falta algo,
// en lugar de descubrirlo con una petición rota.

function requerida(nombre: string): string {
  const valor: unknown = import.meta.env[nombre]
  if (typeof valor !== 'string' || valor.trim() === '') {
    throw new Error(`Falta la variable ${nombre} en .env (ver .env.example)`)
  }
  return valor.trim()
}

export const config = {
  apiUrl: requerida('VITE_API_URL').replace(/\/+$/, ''),
}
