// components/ActiveWorkOrdersVisualization.js

"use client";

import { useEffect, useState } from "react";
import { Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ActiveWorkOrdersVisualization() {
  const [activeWorkOrders, setActiveWorkOrders] = useState(0);
  const [lastWeekChange, setLastWeekChange] = useState(0);

  useEffect(() => {
    // Fetch active work orders data from Django API
    fetch('http://localhost:8000/api/active-work-orders/')
      .then(response => response.json())
      .then(data => {
        const activeCount = data.reduce((acc, item) => acc + item.count, 0);
        setActiveWorkOrders(activeCount);

        // Calculate the change from last week (adjust logic if needed)
        const lastWeekData = data.filter(item => new Date(item.WO_created_date) < new Date());
        setLastWeekChange(lastWeekData.length); // Adjust as needed
      })
      .catch(error => console.error('Error fetching data:', error));

  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Work Orders</CardTitle>
          <Wrench className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeWorkOrders}</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-red-500">+{lastWeekChange}</span> from last week
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
