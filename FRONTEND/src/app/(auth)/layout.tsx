
import './login/login.css';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-gray-200">
      {children}
    </div>
  );
}
