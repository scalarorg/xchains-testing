import Link from "next/link";

export default function About() {
  return (
    <div>
      <h1>About Us</h1>
      <p>This is a dummy about page using the App Router.</p>
      <Link href="/">Home</Link>
    </div>
  );
}
