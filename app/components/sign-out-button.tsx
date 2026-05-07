import { logoutAction } from "@/app/actions/auth-logout"
import { Button } from "@/components/ui/button"

export function SignOutButton() {
  return (
    <form action={logoutAction}>
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
