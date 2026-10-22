"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { CustomExamReview } from "@/components/custom-exam-review"

function ReviewContent() {
  const id = useSearchParams().get("id") ?? ""
  return <CustomExamReview id={id} />
}

export default function ReviewPage() {
  return (
    <Suspense fallback={null}>
      <ReviewContent />
    </Suspense>
  )
}
