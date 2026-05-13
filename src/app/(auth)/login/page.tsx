import { LoginForm } from "@/components/features/auth/LoginForm";

export const metadata = {
  title: "Entrar | CopySell AI",
};

export default function LoginPage() {
  return (
    <div>
      <h1 className="mb-6 text-center text-xl font-semibold">Entrar</h1>
      <LoginForm />
    </div>
  );
}
