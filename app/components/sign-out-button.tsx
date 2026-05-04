import { signOut } from "@/auth"
import { Button } from "@/components/ui/button"

export function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server"
        await signOut({ redirectTo: "/login" })
      }}
    >
      <Button
        variant="outline"
        type="submit"
        className="border-header-bg text-header-bg hover:bg-header-bg hover:text-white"
      >
        Salir
      </Button>
    </form>
  )
}
