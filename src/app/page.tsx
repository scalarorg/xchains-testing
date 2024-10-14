import Link from "next/link";

export default function Home() {
  return (
    <div>
      <h1>Welcome to My Next.js App</h1>
      <p>This is a dummy home page using the App Router.</p>
      <Link href="/about">About</Link>
    </div>
  );
}
