import { redirect } from "next/navigation";

export default function PaymentRedirect() {
  redirect("/dashboard/payment");
}
