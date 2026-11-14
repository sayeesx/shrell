import Basket from "@/components/ui/hairline-basket";

export default function BasketDemo() {
  return (
    <div className="flex w-full items-center justify-center p-10">
      <Basket style={{ width: 220 }} label="An empty wire basket" />
    </div>
  );
}
