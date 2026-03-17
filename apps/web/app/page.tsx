import { PreviewRequestForm } from "@/components/PreviewRequestForm";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            ZapSight
          </h1>
          <p className="mt-3 text-lg text-gray-600">
            Enter your store URL to see a preview of ZapSight on your site.
          </p>
        </div>
        <PreviewRequestForm />
      </div>
    </main>
  );
}
