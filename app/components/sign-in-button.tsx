"use client"

import Link from "next/link"

export function SignInButton() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-center text-gray-600">No tienes cuenta?</p>
      <Link
        href="/register"
        className="w-full bg-blue-600 text-white py-2 px-4 rounded font-medium hover:bg-blue-700 transition text-center"
      >
        Crear cuenta
      </Link>
    </div>
  )
}
