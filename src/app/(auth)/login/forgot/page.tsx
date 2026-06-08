import { ForgotPasswordForm } from "@/components/features/auth/ForgotPasswordForm";

export const metadata = {
  title: "Recuperar senha",
};

export default function ForgotPasswordPage() {
  return (
    <div>
      <h1 className="mb-6 text-center text-xl font-semibold">Recuperar senha</h1>
      <ForgotPasswordForm />
    </div>
  );
}
