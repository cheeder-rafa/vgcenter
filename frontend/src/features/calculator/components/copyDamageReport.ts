export async function copyDamageReport(text: string): Promise<void> {
  await navigator.clipboard.writeText(text)
}
