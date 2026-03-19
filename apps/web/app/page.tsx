import { Suspense } from "react";
import { PreviewRequestForm } from "@/components/PreviewRequestForm";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            See Your Store With ZapSight&apos;s AI
          </h1>
          <p className="mt-3 text-lg text-gray-600">
            Enter your store URL to get a free preview of Shop Pilot on your
            site
          </p>
        </div>
        <Suspense fallback={null}>
          <PreviewRequestForm />
        </Suspense>
      </div>
    </main>
  );
}
