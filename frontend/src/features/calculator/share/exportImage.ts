import { toPng } from 'html-to-image'

import { useToastStore } from '../store/useToastStore'

export async function exportResultImage(el: HTMLElement): Promise<void> {
  let dataUrl: string
  try {
    dataUrl = await toPng(el)
  } catch {
    useToastStore.getState().push('Export failed — could not capture panel')
    return
  }

  if (
    typeof ClipboardItem !== 'undefined' &&
    navigator.clipboard?.write !== undefined
  ) {
    try {
      const blob = await (await fetch(dataUrl)).blob()
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ])
      useToastStore.getState().push('PNG copied to clipboard')
      return
    } catch {
      // fall through to download
    }
  }

  const a = document.createElement('a')
  a.href = dataUrl
  a.download = 'vgcenter-calc.png'
  a.click()
  useToastStore.getState().push('PNG downloaded')
}
