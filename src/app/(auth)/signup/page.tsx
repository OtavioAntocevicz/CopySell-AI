import { SignupForm } from "@/components/features/auth/SignupForm";

export const metadata = {
  title: "Cadastro | CopySell AI",
};

export default function SignupPage() {
  return (
    <div>
      <h1 className="mb-6 text-center text-xl font-semibold">Criar conta</h1>
      <SignupForm />
    </div>
  );
}
