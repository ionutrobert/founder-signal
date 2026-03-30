'use client'

import { Copy, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface ShareButtonsProps {
  resultId: string
  title: string
}

export function ShareButtons({ resultId, title }: ShareButtonsProps) {
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/result?id=${resultId}`
    : ''

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Link copied', {
        description: 'Share link copied to clipboard'
      })
    } catch {
      toast.error('Failed to copy', {
        description: 'Could not copy link to clipboard'
      })
    }
  }

  const handleDownloadPDF = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${title} - Founder Signal Report</title>
            <style>
              body { font-family: system-ui, sans-serif; padding: 40px; }
              h1 { color: #0f172a; }
              .section { margin: 24px 0; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px; }
            </style>
          </head>
          <body>
            <h1>Founder Signal Report</h1>
            <h2>${title}</h2>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
            <hr />
            <p>View full report at: ${shareUrl}</p>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleCopyLink}
        className="gap-1.5"
      >
        <Copy className="h-4 w-4" />
        Copy Link
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleDownloadPDF}
        className="gap-1.5"
      >
        <Download className="h-4 w-4" />
        Download PDF
      </Button>
    </div>
  )
}
