"use client";

import React from "react";
import { useParams } from "next/navigation";
import { DecisionCardPanel } from "@/components/trading/DecisionCard";

export default function DecisionPage() {
  const params = useParams<{ id: string }>();
  return <DecisionCardPanel id={typeof params?.id === "string" ? params.id : ""} />;
}
