/** The signed-in user as the app shell, sidebar and account menu see them. */
export interface ShellUser {
  name: string | null
  email: string | null
  image: string | null
  /** Shows the Admin entry. The admin pages and APIs check the role themselves. */
  isAdmin?: boolean
}
