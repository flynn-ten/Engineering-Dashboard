// app/active-work-orders/page.js

import ActiveWorkOrdersCard from "@/components/ActiveWorkOrdersVisualization";

export default function ActiveWorkOrdersPage() {
  return (
    <div>
      <h1>Active Work Orders Visualization</h1>
      <ActiveWorkOrdersVisualization />
    </div>
  );
}
