import { logoutAction } from "@/app/actions/auth-logout"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export function SignOutButton() {
  return (
    <form action={logoutAction}>
      <Button
        variant="default"
        type="submit"
        className="h-9 gap-2 border-0 bg-[#12343B] px-3 text-white shadow-sm shadow-header-top/15 hover:bg-[#0F202A] hover:text-white"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        <span>Salir</span>
      </Button>
    </form>
  )
}
