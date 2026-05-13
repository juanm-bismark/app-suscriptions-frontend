import { logoutAction } from "@/app/actions/auth-logout"
import { SignOutSubmitButton } from "@/app/components/sign-out-submit-button"

export function SignOutButton() {
  return (
    <form action={logoutAction}>
      <SignOutSubmitButton />
    </form>
  )
}
