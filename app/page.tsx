import { Chat } from "@/components/chat";

export default function Home() {
  return <Chat hasServerKey={Boolean(process.env.ANTHROPIC_API_KEY)} />;
}
