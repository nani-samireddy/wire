import { Home } from "@/components/app/Home";
import { bagelFatOne } from "./layout";
import { cn } from "@/lib/utils";

export default function Page() {
	
	return (
		<div className="font-[family-name:var(--font-geist-sans)]">		
			<main>
				<div className="border-b-1 border-black text-center">
			<h1 className={cn("p-4 text-3xl", bagelFatOne.className)}>WIRE</h1>
		</div>
				<Home />
			</main>
		</div>
	);
}
