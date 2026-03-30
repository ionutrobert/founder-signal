'use client'

import { Download, GitCompare } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ShareButtons } from '@/components/share-buttons'

interface ActionPanelProps {
  resultId: string
  title: string
}

export function ActionPanel({ resultId, title }: ActionPanelProps) {
  const handleDownloadPDF = () => {
    window.print()
  }

  const compareUrl = `/compare?ids=${resultId}`

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Actions</h3>
      <div className="space-y-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadPDF}
          className="w-full justify-start gap-2"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Download PDF
        </Button>
        <Link href={compareUrl}>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
          >
            <GitCompare className="h-4 w-4" aria-hidden="true" />
            Compare Ideas
          </Button>
        </Link>
      </div>
      <ShareButtons resultId={resultId} title={title} />
    </div>
  )
}
