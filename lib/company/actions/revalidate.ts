import { revalidatePath } from "next/cache"

export function revalidateCompanySurfaces() {
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/company")
  revalidatePath("/dashboard/company/moabits")
  revalidatePath("/dashboard/credentials")
}

export function revalidateMoabitsMappingSurfaces() {
  revalidatePath("/dashboard/company")
  revalidatePath("/dashboard/company/moabits")
}

