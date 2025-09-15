
export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="h-[calc(100vh-8rem)]">{children}</div>;
}
