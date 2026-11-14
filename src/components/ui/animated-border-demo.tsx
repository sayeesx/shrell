import { AnimatedBorder } from "@/components/ui/animated-border";

export default function AnimatedBorderDemo() {
  return (
    <div className="flex min-h-[320px] w-full items-center justify-center p-10">
      <AnimatedBorder className="w-72">
        <div className="flex flex-col gap-2 p-6">
          <h3 className="text-sm font-medium">Default</h3>
          <p className="text-sm text-muted-foreground">
            The primary colour, six seconds a lap.
          </p>
        </div>
      </AnimatedBorder>
    </div>
  );
}
