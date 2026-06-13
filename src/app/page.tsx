import { redirect } from "next/navigation";

// Root page: always redirect to login (middleware handles session → dashboard)
export default function Home() {
  redirect("/login");
}
