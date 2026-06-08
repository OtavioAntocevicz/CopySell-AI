import { ResetPasswordForm } from "@/components/features/auth/ResetPasswordForm";

export const metadata = {
  title: "Nova senha",
};

export default function ResetPasswordPage() {
  return (
    <div>
      <h1 className="mb-6 text-center text-xl font-semibold">Nova senha</h1>
      <ResetPasswordForm />
    </div>
  );
}
